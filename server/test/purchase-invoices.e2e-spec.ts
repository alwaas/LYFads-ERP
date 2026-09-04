import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { PurchaseInvoiceStatus } from '@prisma/client';

describe('Accounts Payable / Vendor Bills E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  let tenantAVendor: any;
  let tenantBVendor: any;
  let tenantAPo: any;
  let tenantBPo: any;

  const adminToken = () =>
    jwtService.sign({
      sub: testData.tenantAAdmin.id,
      email: testData.tenantAAdmin.email,
      role: testData.tenantAAdmin.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAAdmin.fullName,
    });

  const tenantBToken = () =>
    jwtService.sign({
      sub: testData.tenantBAdmin.id,
      email: testData.tenantBAdmin.email,
      role: testData.tenantBAdmin.role,
      tenantId: testData.tenantB.id,
      fullName: testData.tenantBAdmin.fullName,
    });

  const employeeToken = () =>
    jwtService.sign({
      sub: testData.tenantAEmployee.id,
      email: testData.tenantAEmployee.email,
      role: testData.tenantAEmployee.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAEmployee.fullName,
    });

  const nowIsoDate = () => new Date().toISOString().split('T')[0];
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
        phone: '2222222222',
        isActive: true,
      },
    });

    const poFields = (vendorId: string, tenantId: string, orderNumber: string) => ({
      orderNumber,
      vendorId,
      status: 'APPROVED' as const,
      orderDate: new Date(),
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      tenantId,
    });

    tenantAPo = await prisma.purchaseOrder.create({
      data: poFields(tenantAVendor.id, testData.tenantA.id, 'PO-A-001'),
    });
    tenantBPo = await prisma.purchaseOrder.create({
      data: poFields(tenantBVendor.id, testData.tenantB.id, 'PO-B-001'),
    });
  }, 90000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.purchaseInvoiceItem.deleteMany();
      await prisma.purchaseInvoice.deleteMany();
      await prisma.paymentAllocation.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.activityLog.deleteMany();
    } catch (e) {
      // Tables may not exist if migration hasn't been applied
    }
  });

  const createBill = (overrides: Record<string, any> = {}) =>
    request(app.getHttpServer())
      .post('/purchase-invoices')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(overrides);

  const approveBill = (id: string) =>
    request(app.getHttpServer())
      .post(`/purchase-invoices/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken()}`);

  const postBill = (id: string) =>
    request(app.getHttpServer())
      .post(`/purchase-invoices/${id}/post`)
      .set('Authorization', `Bearer ${adminToken()}`);

  const baseBill = (vendorId = tenantAVendor.id) => ({
    invoiceNumber: `BILL-${Date.now()}`,
    vendorId,
    dueDate: nowIsoDate(),
    items: [{ description: 'Item A', quantity: '3', unitCost: '10.00' }],
  });

  describe('Role / Auth', () => {
    it('rejects unauthenticated', async () => {
      await request(app.getHttpServer()).get('/purchase-invoices').expect(401);
    });

    it('rejects EMPLOYEE role', async () => {
      await request(app.getHttpServer())
        .get('/purchase-invoices')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .expect(403);
    });
  });

  describe('Create vendor bill', () => {
    it('creates a draft bill with totals and line items', async () => {
      const res = await createBill(baseBill()).expect(201);
      const body = res.body.data ?? res.body;
      expect(body.status).toBe(PurchaseInvoiceStatus.DRAFT);
      expect(body.items).toHaveLength(1);
      expect(parseFloat(body.total)).toBe(30);
      expect(parseFloat(body.balanceAmount)).toBe(30);
      expect(body.amountPaid).toBe('0');
      expect(body.vendorId).toBe(tenantAVendor.id);

      const stored = await prisma.purchaseInvoice.findUnique({
        where: { id: body.id },
        include: { items: true },
      });
      expect(stored).toBeTruthy();
      expect(stored.items).toHaveLength(1);
      expect(parseFloat(stored.subtotal)).toBe(30);
    });

    it('rejects inactive/non-tenant vendor (cross-tenant vendor)', async () => {
      await createBill({ ...baseBill(), vendorId: tenantBVendor.id }).expect(403);
    });

    it('rejects non-existent vendor', async () => {
      await createBill({ ...baseBill(), vendorId: 'nonexistent_vendor_id' }).expect(403);
    });
  });

  describe('Purchase order linkage', () => {
    it('links a tenant-owned purchase order', async () => {
      const res = await createBill({ ...baseBill(), purchaseOrderId: tenantAPo.id }).expect(201);
      const body = res.body.data ?? res.body;
      expect(body.purchaseOrder.id).toBe(tenantAPo.id);
    });

    it('rejects cross-tenant purchase order', async () => {
      await createBill({ ...baseBill(), purchaseOrderId: tenantBPo.id }).expect(403);
    });

    it('rejects non-existent purchase order', async () => {
      await createBill({ ...baseBill(), purchaseOrderId: 'no_such_po' }).expect(403);
    });
  });

  describe('Financial correctness (decimals, tax, discount)', () => {
    it('computes multi-line totals', async () => {
      const res = await createBill({
        ...baseBill(),
        items: [
          { description: 'A', quantity: '3', unitCost: '10.00' },
          { description: 'B', quantity: '2', unitCost: '8.00' },
        ],
      }).expect(201);
      const body = res.body.data ?? res.body;
      expect(parseFloat(body.subtotal)).toBe(46);
      expect(parseFloat(body.total)).toBe(46);
    });

    it('applies tax and discount per line', async () => {
      const res = await createBill({
        ...baseBill(),
        items: [{ description: 'X', quantity: '2', unitCost: '10.00', tax: '4.00', discount: '1.00' }],
      }).expect(201);
      const body = res.body.data ?? res.body;
      expect(parseFloat(body.subtotal)).toBe(20);
      expect(parseFloat(body.tax)).toBe(4);
      expect(parseFloat(body.discount)).toBe(1);
      expect(parseFloat(body.total)).toBe(23);
    });
  });

  describe('Invoice number uniqueness', () => {
    it('rejects duplicate invoice number in same tenant', async () => {
      const first = await createBill(baseBill()).expect(201);
      const number = (first.body.data ?? first.body).invoiceNumber;
      await createBill({ ...baseBill(), invoiceNumber: number }).expect(409);
    });
  });

  describe('Status lifecycle', () => {
    it('transitions DRAFT -> APPROVED -> POSTED', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;

      let a = await approveBill(id).expect(201);
      expect((a.body.data ?? a.body).status).toBe(PurchaseInvoiceStatus.APPROVED);

      let p = await postBill(id).expect(201);
      expect((p.body.data ?? p.body).status).toBe(PurchaseInvoiceStatus.POSTED);
    });

    it('rejects invalid transition (approve a POSTED bill)', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      await approveBill(id).expect(409);
    });

    it('rejects invalid transition (cancel a POSTED bill)', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      await request(app.getHttpServer())
        .post(`/purchase-invoices/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(409);
    });

    it('cancels a draft bill', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      const r = await request(app.getHttpServer())
        .post(`/purchase-invoices/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      expect((r.body.data ?? r.body).status).toBe(PurchaseInvoiceStatus.CANCELLED);
    });

    it('voids a posted bill with no payments', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      const r = await request(app.getHttpServer())
        .post(`/purchase-invoices/${id}/void`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);
      expect((r.body.data ?? r.body).status).toBe(PurchaseInvoiceStatus.VOIDED);
    });

    it('prevents voiding a posted bill that has payments', async () => {
      const res = await createBill({
        ...baseBill(),
        items: [{ description: 'A', quantity: '2', unitCost: '10.00' }],
      }).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      const billTotal = (await prisma.purchaseInvoice.findUnique({ where: { id }, select: { total: true } })).total;

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          purchaseInvoiceId: id,
          amount: billTotal,
          paymentDate: nowIsoDate(),
          method: 'BANK_TRANSFER',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/purchase-invoices/${id}/void`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(409);
    });

    it('rejects editing a posted bill', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      await request(app.getHttpServer())
        .patch(`/purchase-invoices/${id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ notes: 'edited after posting' })
        .expect(409);
    });
  });

  describe('Vendor payment & allocation', () => {
    const setupPostedBill = async (total = '60.00') => {
      const res = await createBill({
        ...baseBill(),
        items: [{ description: 'A', quantity: '1', unitCost: total }],
      }).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);
      return id;
    };

    it('creates a vendor payment and updates outstanding balance (full payment)', async () => {
      const id = await setupPostedBill('60.00');
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          purchaseInvoiceId: id,
          amount: '60.00',
          paymentDate: nowIsoDate(),
          method: 'BANK_TRANSFER',
        })
        .expect(201);

      expect((payRes.body.data ?? payRes.body).purchaseInvoiceId).toBe(id);

      const bill = await prisma.purchaseInvoice.findUnique({ where: { id } });
      expect(parseFloat(bill.balanceAmount)).toBe(0);
      expect(bill.status).toBe(PurchaseInvoiceStatus.PAID);
    });

    it('applies a partial payment', async () => {
      const id = await setupPostedBill('60.00');
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          purchaseInvoiceId: id,
          amount: '20.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(201);

      const bill = await prisma.purchaseInvoice.findUnique({ where: { id } });
      expect(parseFloat(bill.balanceAmount)).toBe(40);
      expect(bill.status).toBe(PurchaseInvoiceStatus.PARTIALLY_PAID);
    });

    it('allocates a payment to the vendor bill', async () => {
      const id = await setupPostedBill('100.00');
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          amount: '100.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(201);
      const paymentId = (payRes.body.data ?? payRes.body).id;
      expect((payRes.body.data ?? payRes.body).purchaseInvoiceId).toBeNull();

      const allocRes = await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ paymentId, purchaseInvoiceId: id, amount: '100.00' })
        .expect(201);

      expect(allocRes.body.data.purchaseInvoiceId).toBe(id);

      const bill = await prisma.purchaseInvoice.findUnique({ where: { id }, select: { balanceAmount: true, status: true } });
      expect(parseFloat(bill.balanceAmount)).toBe(0);
      expect(bill.status).toBe(PurchaseInvoiceStatus.PAID);
    });

    it('rejects over-allocation (allocation exceeds payment amount)', async () => {
      const id = await setupPostedBill('100.00');
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          amount: '100.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(201);
      const paymentId = (payRes.body.data ?? payRes.body).id;

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ paymentId, purchaseInvoiceId: id, amount: '150.00' })
        .expect(409);
    });

    it('rejects duplicate allocation', async () => {
      const id = await setupPostedBill('100.00');
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          amount: '100.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(201);
      const paymentId = (payRes.body.data ?? payRes.body).id;

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ paymentId, purchaseInvoiceId: id, amount: '100.00' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ paymentId, purchaseInvoiceId: id, amount: '100.00' })
        .expect(409);
    });
  });

  describe('Cross-tenant isolation', () => {
    it('tenant B cannot create a bill for tenant A vendor', async () => {
      await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          invoiceNumber: `BILL-B-${Date.now()}`,
          vendorId: tenantAVendor.id,
          dueDate: nowIsoDate(),
          items: [{ description: 'A', quantity: '1', unitCost: '5.00' }],
        })
        .expect(403);
    });

    it('tenant B cannot pay tenant A bill', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          purchaseInvoiceId: id,
          amount: '10.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(403);
    });

    it('tenant B cannot allocate against tenant A payment/bill', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);

      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          purchaseInvoiceId: id,
          amount: '10.00',
          paymentDate: nowIsoDate(),
          method: 'CASH',
        })
        .expect(201);
      const paymentId = (payRes.body.data ?? payRes.body).id;

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({ paymentId, purchaseInvoiceId: id, amount: '10.00' })
        .expect(403);
    });

    it('tenant B cannot view tenant A bill', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;
      await request(app.getHttpServer())
        .get(`/purchase-invoices/${id}`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .expect(403);
    });
  });

  describe('AP aging', () => {
    it('buckets outstanding balances by due date', async () => {
      const res = await createBill({
        ...baseBill(),
        dueDate: daysAgo(95),
        items: [{ description: 'A', quantity: '10', unitCost: '5.00' }],
      }).expect(201);
      const id = (res.body.data ?? res.body).id;
      await approveBill(id).expect(201);
      await postBill(id).expect(201);

      const rep = await request(app.getHttpServer())
        .get('/reports/payables')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      const body = rep.body.data ?? rep.body;
      expect(body.totalPayables).toBe(50);
      expect(body.aging.days90plus).toBe(50);
      expect(body.topOutstandingVendors[0].purchaseInvoiceId).toBe(id);
    });
  });

  describe('Audit logging', () => {
    it('logs vendor bill creation', async () => {
      const res = await createBill(baseBill()).expect(201);
      const id = (res.body.data ?? res.body).id;

      const number = (res.body.data ?? res.body).invoiceNumber;
      const log = await prisma.activityLog.findFirst({
        where: { module: 'VENDOR_BILL', action: 'CREATE', tenantId: testData.tenantA.id },
      });
      expect(log).toBeTruthy();
      expect(log.description).toContain(number);
    });
  });
});
