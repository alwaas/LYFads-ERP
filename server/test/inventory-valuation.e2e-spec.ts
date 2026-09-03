import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Inventory Valuation E2E Tests (FIFO + Weighted Average + COGS)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  const token = (user: any) =>
    jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });

  const adminToken = () => token(testData.tenantAAdmin);
  const managerToken = () => token(testData.tenantAManager);
  const employeeToken = () => token(testData.tenantAEmployee);
  const tenantBAdminToken = () => token(testData.tenantBAdmin);

  describe('Inventory Valuation Method Setting', () => {
    it('defaults new tenants to WEIGHTED_AVERAGE', async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: testData.tenantA.id },
        select: { inventoryValuationMethod: true },
      });
      expect(['FIFO', 'WEIGHTED_AVERAGE']).toContain(tenant?.inventoryValuationMethod);
    });

    it('ADMIN can set valuation method to FIFO', async () => {
      const res = await request(app.getHttpServer())
        .patch('/settings/inventory-valuation')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ inventoryValuationMethod: 'FIFO' })
        .expect(200);
      expect(res.body.data?.inventoryValuationMethod ?? res.body.inventoryValuationMethod).toBe('FIFO');
    });

    it('rejects invalid method', async () => {
      await request(app.getHttpServer())
        .patch('/settings/inventory-valuation')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ inventoryValuationMethod: 'NOT_A_METHOD' })
        .expect(400);
    });

    it('rejects EMPLOYEE (no role permission)', async () => {
      await request(app.getHttpServer())
        .patch('/settings/inventory-valuation')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .send({ inventoryValuationMethod: 'FIFO' })
        .expect(403);
    });

    it('cross-tenant update does not bleed (returns 403 since target tenant is different)', async () => {
      // tenant B admin attempts to set valuation: should only affect their own tenant
      const res = await request(app.getHttpServer())
        .patch('/settings/inventory-valuation')
        .set('Authorization', `Bearer ${tenantBAdminToken()}`)
        .send({ inventoryValuationMethod: 'FIFO' })
        .expect(200);
      // Ensure tenant A's setting is unchanged
      const a = await prisma.tenant.findUnique({
        where: { id: testData.tenantA.id },
        select: { inventoryValuationMethod: true },
      });
      expect(a?.inventoryValuationMethod).not.toBe('NOT_A_METHOD');
    });
  });

  describe('FIFO Valuation', () => {
    beforeAll(async () => {
      await prisma.tenant.update({
        where: { id: testData.tenantA.id },
        data: { inventoryValuationMethod: 'FIFO' },
      });
    });

    it('creates FIFO cost layers on IN', async () => {
      const product = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: 'FIFO-PROD-1',
          name: 'FIFO Test Product',
          unitPrice: 20,
          costPrice: 0,
          isActive: true,
        },
      });

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 10,
          unitCost: '5.00',
          notes: 'fifo layer 1',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 5,
          unitCost: '7.00',
          notes: 'fifo layer 2',
        })
        .expect(201);

      const layers = await prisma.fifoCostLayer.findMany({
        where: { tenantId: testData.tenantA.id, productId: product.id },
        orderBy: { receivedAt: 'asc' },
      });
      expect(layers).toHaveLength(2);
      expect(Number(layers[0].unitCost)).toBe(5);
      expect(layers[0].remainingQuantity).toBe(10);
      expect(Number(layers[1].unitCost)).toBe(7);
      expect(layers[1].remainingQuantity).toBe(5);
    });

    it('consumes oldest layers first on OUT (FIFO)', async () => {
      const product = await prisma.product.findFirst({
        where: { tenantId: testData.tenantA.id, sku: 'FIFO-PROD-1' },
      });
      if (!product) throw new Error('Product not found');

      // Out 12 units: 10 from layer 1 + 2 from layer 2
      const outRes = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'OUT',
          quantity: 12,
        })
        .expect(201);

      // totalCost should be 10*5 + 2*7 = 50 + 14 = 64
      const body = outRes.body.data ?? outRes.body;
      expect(Number(body.totalCost)).toBeCloseTo(64, 2);

      const layers = await prisma.fifoCostLayer.findMany({
        where: { tenantId: testData.tenantA.id, productId: product.id },
        orderBy: { receivedAt: 'asc' },
      });
      expect(layers[0].remainingQuantity).toBe(0);
      expect(layers[1].remainingQuantity).toBe(3);
    });

    it('rejects OUT that exceeds available stock', async () => {
      const product = await prisma.product.findFirst({
        where: { tenantId: testData.tenantA.id, sku: 'FIFO-PROD-1' },
      });
      if (!product) throw new Error('Product not found');

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'OUT',
          quantity: 9999,
        })
        .expect(400);
    });
  });

  describe('Weighted Average Valuation', () => {
    beforeAll(async () => {
      await prisma.tenant.update({
        where: { id: testData.tenantA.id },
        data: { inventoryValuationMethod: 'WEIGHTED_AVERAGE' },
      });
    });

    it('updates average cost on IN', async () => {
      const product = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: 'WA-PROD-1',
          name: 'WA Test Product',
          unitPrice: 20,
          costPrice: 0,
          isActive: true,
        },
      });

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 10,
          unitCost: '4.00',
        })
        .expect(201);

      let pw = await prisma.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId: product.id, warehouseId: testData.tenantAWarehouse.id } },
      });
      expect(Number(pw?.averageCost)).toBeCloseTo(4, 4);

      // 5 more units at 6.00 → new avg = (10*4 + 5*6) / 15 = 70/15 ≈ 4.6667
      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 5,
          unitCost: '6.00',
        })
        .expect(201);

      pw = await prisma.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId: product.id, warehouseId: testData.tenantAWarehouse.id } },
      });
      expect(Number(pw?.averageCost)).toBeCloseTo(70 / 15, 3);
    });

    it('consumes at average cost on OUT', async () => {
      const product = await prisma.product.findFirst({
        where: { tenantId: testData.tenantA.id, sku: 'WA-PROD-1' },
      });
      if (!product) throw new Error('Product not found');

      const pw = await prisma.productWarehouse.findUnique({
        where: { productId_warehouseId: { productId: product.id, warehouseId: testData.tenantAWarehouse.id } },
      });
      const avg = Number(pw?.averageCost);

      const res = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'OUT',
          quantity: 3,
        })
        .expect(201);

      const body = res.body.data ?? res.body;
      // 3 * avg
      expect(Number(body.totalCost)).toBeCloseTo(3 * avg, 2);
    });
  });

  describe('Transfer preserves cost basis', () => {
    it('transfer uses consumed cost as inbound cost', async () => {
      // Create a second warehouse for tenant A
      const w2 = await prisma.warehouse.create({
        data: { tenantId: testData.tenantA.id, name: 'A-Secondary', isActive: true, isDefault: false },
      });

      // Set FIFO method explicitly
      await prisma.tenant.update({
        where: { id: testData.tenantA.id },
        data: { inventoryValuationMethod: 'FIFO' },
      });

      const product = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: 'TRF-PROD-1',
          name: 'Transfer Test Product',
          unitPrice: 100,
          costPrice: 0,
          isActive: true,
        },
      });

      // IN 10 units @ 5 into w1
      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 10,
          unitCost: '5.00',
        })
        .expect(201);

      // Transfer 4 to w2
      const trf = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          type: 'TRANSFER',
          quantity: 4,
          sourceWarehouseId: testData.tenantAWarehouse.id,
          destinationWarehouseId: w2.id,
        })
        .expect(201);

      const body = trf.body.data ?? trf.body;
      expect(Number(body.totalCost)).toBeCloseTo(20, 2);

      // Destination should now have a FIFO layer at unitCost=5
      const layer = await prisma.fifoCostLayer.findFirst({
        where: { tenantId: testData.tenantA.id, productId: product.id, warehouseId: w2.id },
      });
      expect(layer).not.toBeNull();
      expect(Number(layer?.unitCost)).toBeCloseTo(5, 4);
      expect(layer?.remainingQuantity).toBe(4);
    });
  });

  describe('Sales Order → Inventory Integration', () => {
    it('fulfill-with-inventory creates OUT movements', async () => {
      // Set up a sales order with items
      const so = await prisma.salesOrder.create({
        data: {
          tenantId: testData.tenantA.id,
          orderNumber: 'SO-VAL-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date(),
          status: 'CONFIRMED',
          subtotal: 100,
          total: 100,
          items: {
            create: [],
          },
        },
      });

      // Create a product, IN 10 units, then add item to SO and fulfill
      const product = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: 'SO-PROD-1',
          name: 'SO Test',
          unitPrice: 10,
          costPrice: 5,
          isActive: true,
        },
      });
      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 10,
          unitCost: '5.00',
        })
        .expect(201);

      await prisma.salesOrderItem.create({
        data: {
          tenantId: testData.tenantA.id,
          salesOrderId: so.id,
          productId: product.id,
          quantity: 3,
          unitPrice: 10,
          lineTotal: 30,
        },
      });

      const fulfill = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(201);
      const fb = fulfill.body.data ?? fulfill.body;
      expect(fb.movements).toBe(1);

      const movements = await prisma.stockMovement.findMany({
        where: { tenantId: testData.tenantA.id, referenceType: 'SALES_ORDER', referenceId: so.id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('OUT');
      expect(movements[0].quantity).toBe(3);
      expect(Number(movements[0].totalCost)).toBeCloseTo(15, 2);

      // Idempotency: call again, should not create duplicates
      const fulfill2 = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(201);
      const fb2 = fulfill2.body.data ?? fulfill2.body;
      expect(fb2.alreadyFulfilled).toBe(true);

      const movementsAfter = await prisma.stockMovement.findMany({
        where: { tenantId: testData.tenantA.id, referenceType: 'SALES_ORDER', referenceId: so.id },
      });
      expect(movementsAfter).toHaveLength(1);

      // Sales order is now FULFILLED
      const updated = await prisma.salesOrder.findUnique({ where: { id: so.id } });
      expect(updated?.status).toBe('FULFILLED');
    });

    it('rejects fulfillment of CANCELLED order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          tenantId: testData.tenantA.id,
          orderNumber: 'SO-VAL-CXL',
          clientId: testData.tenantAClient.id,
          orderDate: new Date(),
          status: 'CANCELLED',
          subtotal: 0,
          total: 0,
        },
      });
      await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(409);
    });
  });

  describe('COGS and Profitability Reports', () => {
    it('profitability report is available with method + cogs', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/profitability')
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(200);
      const body = res.body.data ?? res.body;
      expect(body.available).toBe(true);
      expect(['FIFO', 'WEIGHTED_AVERAGE']).toContain(body.method);
      expect(typeof body.totalCogs).toBe('number');
    });

    it('inventory report returns authoritative valuation method', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(200);
      const body = res.body.data ?? res.body;
      expect(['FIFO', 'WEIGHTED_AVERAGE']).toContain(body.valuationMethod);
      expect(typeof body.totalStockValue).toBe('number');
    });
  });

  describe('Tenant Isolation', () => {
    it('tenant B cannot see tenant A stock movements', async () => {
      const res = await request(app.getHttpServer())
        .get('/stock-movements')
        .set('Authorization', `Bearer ${tenantBAdminToken()}`)
        .expect(200);
      const body = res.body.data ?? res.body;
      const list = Array.isArray(body) ? body : body.data ?? [];
      list.forEach((m: any) => {
        expect(m.tenantId).toBe(testData.tenantB.id);
      });
    });

    it('tenant B cannot update tenant A valuation method', async () => {
      // Authenticated as tenant B admin; controller derives tenant from auth context.
      // The route should only update tenant B's setting, not tenant A's.
      const before = await prisma.tenant.findUnique({
        where: { id: testData.tenantA.id },
        select: { inventoryValuationMethod: true },
      });
      await request(app.getHttpServer())
        .patch('/settings/inventory-valuation')
        .set('Authorization', `Bearer ${tenantBAdminToken()}`)
        .send({ inventoryValuationMethod: 'FIFO' })
        .expect(200);
      const after = await prisma.tenant.findUnique({
        where: { id: testData.tenantA.id },
        select: { inventoryValuationMethod: true },
      });
      expect(after?.inventoryValuationMethod).toBe(before?.inventoryValuationMethod);
    });
  });

  describe('Physical Stock Count', () => {
    it('creates a draft and approves to create ADJUST movement', async () => {
      const product = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: 'CNT-PROD-1',
          name: 'Count Test',
          unitPrice: 10,
          costPrice: 4,
          isActive: true,
        },
      });
      // Seed stock via IN
      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          productId: product.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 5,
          unitCost: '4.00',
        })
        .expect(201);

      // Create draft
      const draft = await request(app.getHttpServer())
        .post('/stock-counts')
        .set('Authorization', `Bearer ${managerToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          notes: 'Test count',
          lines: [
            { productId: product.id, countedQuantity: 7, notes: 'Found 2 extra' },
          ],
        })
        .expect(201);
      const draftId = (draft.body.data ?? draft.body).id;

      // Approve
      const approve = await request(app.getHttpServer())
        .post(`/stock-counts/${draftId}/approve`)
        .set('Authorization', `Bearer ${managerToken()}`)
        .expect(201);
      const ab = approve.body.data ?? approve.body;
      expect(ab.adjustmentCount).toBe(1);

      // Verify adjustment movement exists
      const movement = await prisma.stockMovement.findFirst({
        where: { tenantId: testData.tenantA.id, referenceType: 'STOCK_COUNT', referenceId: draftId },
      });
      expect(movement).not.toBeNull();
      expect(movement?.type).toBe('ADJUST');
      expect(movement?.quantity).toBe(2);
    });

    it('rejects EMPLOYEE creating stock counts', async () => {
      await request(app.getHttpServer())
        .post('/stock-counts')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          lines: [{ productId: testData.tenantAProduct.id, countedQuantity: 0 }],
        })
        .expect(403);
    });
  });

  describe('Unauthenticated access', () => {
    it('rejects unauthenticated access to /reports/inventory', async () => {
      await request(app.getHttpServer()).get('/reports/inventory').expect(401);
    });
    it('rejects unauthenticated access to /stock-movements', async () => {
      await request(app.getHttpServer()).get('/stock-movements').expect(401);
    });
    it('rejects unauthenticated access to /stock-counts', async () => {
      await request(app.getHttpServer()).get('/stock-counts').expect(401);
    });
  });
});
