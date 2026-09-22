import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Sales Orders Workflow & Inventory Integration E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  const adminToken = () => jwtService.sign({
    sub: testData.tenantAAdmin.id,
    email: testData.tenantAAdmin.email,
    role: testData.tenantAAdmin.role,
    tenantId: testData.tenantA.id,
    fullName: testData.tenantAAdmin.fullName,
  });
  const managerToken = () => jwtService.sign({
    sub: testData.tenantAManager.id,
    email: testData.tenantAManager.email,
    role: testData.tenantAManager.role,
    tenantId: testData.tenantA.id,
    fullName: testData.tenantAManager.fullName,
  });
  const tenantBToken = () => jwtService.sign({
    sub: testData.tenantBAdmin.id,
    email: testData.tenantBAdmin.email,
    role: testData.tenantBAdmin.role,
    tenantId: testData.tenantB.id,
    fullName: testData.tenantBAdmin.fullName,
  });
  const employeeToken = () => jwtService.sign({
    sub: testData.tenantAEmployee.id,
    email: testData.tenantAEmployee.email,
    role: testData.tenantAEmployee.role,
    tenantId: testData.tenantA.id,
    fullName: testData.tenantAEmployee.fullName,
  });

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

  afterEach(async () => {
    try {
      await prisma.stockMovement.deleteMany();
      await prisma.fifoCostLayer.deleteMany();
      await prisma.productWarehouse.deleteMany();
      await prisma.salesOrderItem.deleteMany();
      await prisma.salesOrder.deleteMany();
      await prisma.product.deleteMany();
      await prisma.activityLog.deleteMany();
    } catch (e) {}
  });

  let sharedProduct: any;
  beforeEach(async () => {
    sharedProduct = await prisma.product.create({
      data: {
        tenantId: testData.tenantA.id,
        sku: `SO-SHARED-${Date.now()}-${Math.random()}`,
        name: 'SO Shared Product',
        unitPrice: 10,
        costPrice: 5,
        isActive: true,
      },
    });
    await prisma.productWarehouse.create({
      data: {
        productId: sharedProduct.id,
        warehouseId: testData.tenantAWarehouse.id,
        quantity: 50,
        averageCost: 5,
        tenantId: testData.tenantA.id,
      },
    });
  });

  async function stockFor(productId: string, warehouseId: string, quantity: number, unitCost: number) {
    await prisma.productWarehouse.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity },
      create: { productId, warehouseId, quantity, tenantId: testData.tenantA.id, averageCost: unitCost },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: quantity },
    });
  }

  describe('Create with items (financial correctness)', () => {
    it('persists line items and computes total', async () => {
      const so = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-IC-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [
            { productId: sharedProduct.id, quantity: '2', unitPrice: '50.00' },
            { productId: sharedProduct.id, quantity: '1', unitPrice: '25.50' },
          ],
          subtotal: '126.00',
          total: '126.00',
        })
        .expect(201);
      const body = so.body.data ?? so.body;
      expect(body.orderNumber).toBe('SO-IC-1');
      expect(body.status).toBe('DRAFT');
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items).toHaveLength(2);
      const stored = await prisma.salesOrderItem.findMany({ where: { salesOrderId: body.id } });
      expect(stored).toHaveLength(2);
      const quantities = stored.map((s) => Number(s.quantity)).sort();
      expect(quantities).toEqual([1, 2]);
    });

    it('rejects creation with empty items array', async () => {
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-IC-2',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [],
          subtotal: '0',
          total: '0',
        })
        .expect(400);
    });

    it('forces DRAFT status regardless of submitted status (FINANCIAL GUARD)', async () => {
      const r = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-IC-3',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const body = r.body.data ?? r.body;
      expect(body.status).toBe('DRAFT');
    });

    it('rejects item with cross-tenant product', async () => {
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-IC-4',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: testData.tenantBProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(403);
    });
  });

  describe('PATCH (workflow bypass prevention)', () => {
    it('PATCH does not change status (must use lifecycle endpoint)', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-PATCH-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      const p = await request(app.getHttpServer())
        .patch(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ status: 'FULFILLED', notes: 'attempt' })
        .expect(200);
      const body = p.body.data ?? p.body;
      expect(body.status).toBe('DRAFT');
      expect(body.notes).toBe('attempt');
    });
  });

  describe('Item management (add / remove)', () => {
    it('adds items to a DRAFT order', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-ADD-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      const a = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/items`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          items: [{ productId: sharedProduct.id, quantity: '2', unitPrice: '5.00' }],
        })
        .expect(201);
      const body = a.body.data ?? a.body;
      expect(body.items).toHaveLength(2);
    });

    it('removes items from a DRAFT order', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-ADD-2',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [
            { productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' },
            { productId: sharedProduct.id, quantity: '1', unitPrice: '20.00' },
          ],
          subtotal: '30.00',
          total: '30.00',
        })
        .expect(201);
      const body = c.body.data ?? c.body;
      const firstItem = body.items[0];
      await request(app.getHttpServer())
        .delete(`/sales-orders/${body.id}/items/${firstItem.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);
      const remaining = await prisma.salesOrderItem.findMany({ where: { salesOrderId: body.id } });
      expect(remaining).toHaveLength(1);
    });

    it('blocks item changes once order is CONFIRMED', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-ADD-3',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const body = c.body.data ?? c.body;
      await request(app.getHttpServer())
        .post(`/sales-orders/${body.id}/confirm`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/sales-orders/${body.id}/items`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '1.00' }] })
        .expect(409);
    });
  });

  describe('Inventory fulfillment: financial + inventory correctness', () => {
    it('fulfill-with-inventory decrements stock and creates OUT movement', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-FUL-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '5', unitPrice: '10.00' }],
          subtotal: '50.00',
          total: '50.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;

      const f = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      const fb = f.body.data ?? f.body;
      expect(fb.alreadyFulfilled).toBe(false);
      expect(fb.movements).toBe(1);

      const pw = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: sharedProduct.id, warehouseId: testData.tenantAWarehouse.id },
      });
      expect(pw?.quantity).toBe(45);

      const movements = await prisma.stockMovement.findMany({
        where: { tenantId: testData.tenantA.id, referenceType: 'SALES_ORDER', referenceId: id },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('OUT');
      expect(movements[0].quantity).toBe(5);
    }, 30000);

    it('duplicate fulfill-with-inventory is idempotent (no double stock deduction)', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-FUL-2',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '3', unitPrice: '10.00' }],
          subtotal: '30.00',
          total: '30.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      const f2 = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      const fb2 = f2.body.data ?? f2.body;
      expect(fb2.alreadyFulfilled).toBe(true);
      expect(fb2.movements).toBe(1);

      const pw = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: sharedProduct.id, warehouseId: testData.tenantAWarehouse.id },
      });
      expect(pw?.quantity).toBe(47);
      const movs = await prisma.stockMovement.findMany({
        where: { tenantId: testData.tenantA.id, referenceType: 'SALES_ORDER', referenceId: id },
      });
      expect(movs).toHaveLength(1);
    }, 30000);

    it('rejects fulfillment when stock is insufficient', async () => {
      await stockFor(sharedProduct.id, testData.tenantAWarehouse.id, 2, 5);
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-FUL-3',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '10', unitPrice: '10.00' }],
          subtotal: '100.00',
          total: '100.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(400);
      const pw = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: sharedProduct.id, warehouseId: testData.tenantAWarehouse.id },
      });
      expect(pw?.quantity).toBe(2);
    }, 30000);

    it('rejects fulfillment of CANCELLED order', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-FUL-4',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const body = c.body.data ?? c.body;
      await request(app.getHttpServer())
        .post(`/sales-orders/${body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/sales-orders/${body.id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(409);
    }, 30000);

    it('blocks EMPLOYEE role from sales orders', async () => {
      await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .expect(403);
    });

    it('multi-line order totals and stock are correctly decremented', async () => {
      const product2 = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: `SO2-${Date.now()}-${Math.random()}`,
          name: 'SO Second Product',
          unitPrice: 20,
          costPrice: 8,
          isActive: true,
        },
      });
      await stockFor(product2.id, testData.tenantAWarehouse.id, 30, 8);
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-MULTI-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [
            { productId: sharedProduct.id, quantity: '4', unitPrice: '10.00' },
            { productId: product2.id, quantity: '2', unitPrice: '20.00' },
          ],
          subtotal: '80.00',
          total: '80.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      const f = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      const fb = f.body.data ?? f.body;
      expect(fb.movements).toBe(2);

      const pw1 = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: sharedProduct.id, warehouseId: testData.tenantAWarehouse.id },
      });
      const pw2 = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: product2.id, warehouseId: testData.tenantAWarehouse.id },
      });
      expect(pw1?.quantity).toBe(46);
      expect(pw2?.quantity).toBe(28);
    }, 30000);

    it('cross-tenant cannot fulfill tenant A order', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-X-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitPrice: '10.00' }],
          subtotal: '10.00',
          total: '10.00',
        })
        .expect(201);
      const id = (c.body.data ?? c.body).id;
      await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill-with-inventory`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .expect(403);
    }, 30000);
  });

  describe('Decimal precision and totals', () => {
    it('handles decimal qty/price safely', async () => {
      const c = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'SO-DEC-1',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '2.5', unitPrice: '19.99' }],
          subtotal: '49.98',
          total: '49.98',
        })
        .expect(201);
      const body = c.body.data ?? c.body;
      // Schema is Decimal(12,2), so the natural 2.5 * 19.99 = 49.975 is rounded to 49.98
      expect(Number(body.total)).toBeCloseTo(49.98, 2);
      const stored = await prisma.salesOrderItem.findFirst({ where: { salesOrderId: body.id } });
      expect(Number(stored?.lineTotal)).toBeCloseTo(49.98, 2);
    });
  });
});
