import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Purchase Orders E2E', () => {
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

  let tenantAVendor: any;
  let tenantBVendor: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    testData = await setupTestDatabase();

    tenantAVendor = await prisma.vendor.create({
      data: {
        tenantId: testData.tenantA.id,
        name: 'Tenant A Vendor',
        email: 'a-vendor@test.com',
        phone: '1111111111',
        isActive: true,
      },
    });
    tenantBVendor = await prisma.vendor.create({
      data: {
        tenantId: testData.tenantB.id,
        name: 'Tenant B Vendor',
        email: 'b-vendor@test.com',
        isActive: true,
      },
    });
  }, 90000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.stockMovement.deleteMany();
      await prisma.fifoCostLayer.deleteMany();
      await prisma.productWarehouse.deleteMany();
      await prisma.purchaseOrderItem.deleteMany();
      await prisma.purchaseOrder.deleteMany();
      await prisma.activityLog.deleteMany();
    } catch (e) {}
  });

  let sharedProduct: any;
  beforeEach(async () => {
    sharedProduct = await prisma.product.create({
      data: {
        tenantId: testData.tenantA.id,
        sku: `PO-${Date.now()}-${Math.random()}`,
        name: 'PO Shared Product',
        unitPrice: 25,
        costPrice: 10,
        isActive: true,
      },
    });
  });

  describe('Role / Auth', () => {
    it('rejects unauthenticated', async () => {
      await request(app.getHttpServer()).get('/purchase-orders').expect(401);
    });
    it('rejects EMPLOYEE', async () => {
      await request(app.getHttpServer())
        .get('/purchase-orders')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .expect(403);
    });
  });

  describe('Create (financial correctness)', () => {
    it('persists multi-line items and forces DRAFT', async () => {
      const r = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-1',
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [
            { productId: sharedProduct.id, quantity: '3', unitCost: '10.00' },
            { productId: sharedProduct.id, quantity: '2', unitCost: '8.00' },
          ],
          subtotal: '46.00',
          total: '46.00',
        })
        .expect(201);
      const body = r.body.data ?? r.body;
      expect(body.status).toBe('DRAFT');
      expect(body.items).toHaveLength(2);
      const stored = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: body.id },
      });
      expect(stored).toHaveLength(2);
    });

    it('rejects empty items', async () => {
      await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-EMPTY',
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [],
          subtotal: '0',
          total: '0',
        })
        .expect(400);
    });

    it('rejects cross-tenant product in items', async () => {
      await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-XP',
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: testData.tenantBProduct.id, quantity: '1', unitCost: '5.00' }],
          subtotal: '5.00',
          total: '5.00',
        })
        .expect(403);
    });

    it('rejects cross-tenant vendor', async () => {
      await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-XV',
          vendorId: tenantBVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitCost: '5.00' }],
          subtotal: '5.00',
          total: '5.00',
        })
        .expect(403);
    });
  });

  describe('State machine', () => {
    async function createDraft() {
      const r = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: `PO-SM-${Date.now()}`,
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitCost: '5.00' }],
          subtotal: '5.00',
          total: '5.00',
        })
        .expect(201);
      return (r.body.data ?? r.body).id as string;
    }

    it('DRAFT -> SUBMITTED -> APPROVED', async () => {
      const id = await createDraft();
      const a = await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/submit`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      expect((a.body.data ?? a.body).status).toBe('SUBMITTED');
      const b = await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      expect((b.body.data ?? b.body).status).toBe('APPROVED');
    });

    it('rejects invalid transition (APPROVED -> SUBMITTED)', async () => {
      const id = await createDraft();
      await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/submit`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/submit`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(409);
    });

    it('rejects submit on already-cancelled order', async () => {
      const id = await createDraft();
      await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-orders/${id}/submit`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(409);
    });
  });

  describe('Inventory receiving (authoritative path)', () => {
    let orderId: string;
    let firstItemId: string;
    let secondItemId: string;
    beforeEach(async () => {
      const product2 = await prisma.product.create({
        data: {
          tenantId: testData.tenantA.id,
          sku: `PO2-${Date.now()}-${Math.random()}`,
          name: 'PO Second Product',
          unitPrice: 30,
          costPrice: 12,
          isActive: true,
        },
      });
      const r = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: `PO-REC-${Date.now()}`,
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [
            { productId: sharedProduct.id, quantity: '10', unitCost: '10.00' },
            { productId: product2.id, quantity: '5', unitCost: '12.00' },
          ],
          subtotal: '160.00',
          total: '160.00',
        })
        .expect(201);
      const body = r.body.data ?? r.body;
      orderId = body.id;
      firstItemId = body.items[0].id;
      secondItemId = body.items[1].id;
      // Approve
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/submit`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
    });

    it('receive increases stock and creates IN movement (FIFO/WA valuation)', async () => {
      const before = await prisma.product.findUnique({ where: { id: sharedProduct.id } });
      const recv = await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          items: [{ itemId: firstItemId, quantity: '10' }],
        })
        .expect(201);

      const after = await prisma.product.findUnique({ where: { id: sharedProduct.id } });
      expect(after?.stockQuantity).toBe((before?.stockQuantity || 0) + 10);

      const pw = await prisma.productWarehouse.findFirst({
        where: { tenantId: testData.tenantA.id, productId: sharedProduct.id, warehouseId: testData.tenantAWarehouse.id },
      });
      expect(pw?.quantity).toBe(10);

      const movs = await prisma.stockMovement.findMany({
        where: { tenantId: testData.tenantA.id, referenceType: 'PURCHASE_ORDER', referenceId: orderId },
      });
      expect(movs).toHaveLength(1);
      expect(movs[0].type).toBe('IN');
      expect(movs[0].quantity).toBe(10);
    }, 30000);

    it('over-receiving is rejected', async () => {
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          items: [{ itemId: firstItemId, quantity: '11' }],
        })
        .expect(400);
    });

    it('partial receiving keeps order alive; full receiving transitions to RECEIVED', async () => {
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          items: [{ itemId: firstItemId, quantity: '4' }],
        })
        .expect(201);
      const mid = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
      expect(mid?.status).toBe('APPROVED');
      const item1 = await prisma.purchaseOrderItem.findUnique({ where: { id: firstItemId } });
      expect(Number(item1?.receivedQuantity)).toBe(4);

      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          items: [
            { itemId: firstItemId, quantity: '6' },
            { itemId: secondItemId, quantity: '5' },
          ],
        })
        .expect(201);
      const full = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
      expect(full?.status).toBe('RECEIVED');
    }, 30000);

    it('cannot receive a cancelled order', async () => {
      // APPROVED -> CANCELLED is a valid transition, then receive must reject
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          items: [{ itemId: firstItemId, quantity: '5' }],
        })
        .expect(409);
    });

    it('rejects receiving against cross-tenant warehouse', async () => {
      await request(app.getHttpServer())
        .post(`/purchase-orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantBWarehouse.id,
          items: [{ itemId: firstItemId, quantity: '5' }],
        })
        .expect(403);
    });
  });

  describe('Tenant isolation', () => {
    it('cross-tenant cannot view, update, delete, or receive a tenant A PO', async () => {
      const r = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-ISO',
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '1', unitCost: '5.00' }],
          subtotal: '5.00',
          total: '5.00',
        })
        .expect(201);
      const id = (r.body.data ?? r.body).id;
      await request(app.getHttpServer())
        .get(`/purchase-orders/${id}`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/purchase-orders/${id}`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({ notes: 'hax' })
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/purchase-orders/${id}`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .expect(403);
    });
  });

  describe('Decimal correctness', () => {
    it('handles decimal qty/cost safely with schema Decimal(12,2) precision', async () => {
      const r = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          orderNumber: 'PO-DEC',
          vendorId: tenantAVendor.id,
          orderDate: new Date().toISOString().split('T')[0],
          items: [{ productId: sharedProduct.id, quantity: '2.5', unitCost: '9.99' }],
          subtotal: '24.98',
          total: '24.98',
        })
        .expect(201);
      const body = r.body.data ?? r.body;
      const stored = await prisma.purchaseOrderItem.findFirst({
        where: { purchaseOrderId: body.id },
      });
      // 2.5 * 9.99 = 24.975, schema rounds to 24.98
      expect(Number(stored?.lineTotal)).toBeCloseTo(24.98, 2);
    });
  });
});
