import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { PaymentStatus, InvoiceStatus } from '@prisma/client';

describe('Payments & AR (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let testTenantId: string;
  let clientId: string;
  let otherTenantId: string;
  let otherClientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant A',
        slug: `tenant-a-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = tenantA.id;

    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant B',
        slug: `tenant-b-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    otherTenantId = tenantB.id;

    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.local`,
        password: passwordHash,
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        tenant: { connect: { id: tenantA.id } },
      },
    });

    const manager = await prisma.user.create({
      data: {
        email: `manager-${Date.now()}@test.local`,
        password: passwordHash,
        fullName: 'Manager User',
        role: UserRole.MANAGER,
        tenant: { connect: { id: tenantA.id } },
      },
    });

    const employee = await prisma.user.create({
      data: {
        email: `employee-${Date.now()}@test.local`,
        password: passwordHash,
        fullName: 'Employee User',
        role: UserRole.EMPLOYEE,
        tenant: { connect: { id: tenantA.id } },
      },
    });

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId,
      fullName: admin.fullName,
    });

    managerToken = jwtService.sign({
      sub: manager.id,
      email: manager.email,
      role: manager.role,
      tenantId: manager.tenantId,
      fullName: manager.fullName,
    });

    employeeToken = jwtService.sign({
      sub: employee.id,
      email: employee.email,
      role: employee.role,
      tenantId: employee.tenantId,
      fullName: employee.fullName,
    });

    const clientA = await prisma.client.create({
      data: {
        companyName: 'Client A',
        contactPerson: 'Contact A',
        email: `client-a-${Date.now()}@test.local`,
        tenantId: testTenantId,
      },
    });
    clientId = clientA.id;

    const clientB = await prisma.client.create({
      data: {
        companyName: 'Client B',
        contactPerson: 'Contact B',
        email: `client-b-${Date.now()}@test.local`,
        tenantId: otherTenantId,
      },
    });
    otherClientId = clientB.id;
  });

  afterAll(async () => {
    try {
      await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
    } catch (error) {}
    try {
      await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}
    try {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
    } catch (error) {}
    try {
      await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}
    try {
      await prisma.invoice.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}
    try {
      await prisma.client.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}
    try {
      await prisma.client.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}
    try {
      await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}
    try {
      await prisma.user.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}
    try {
      await prisma.tenant.delete({ where: { id: otherTenantId } });
    } catch (error) {}
    try {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    } catch (error) {}
    await app.close();
  });

  describe('Payment CRUD', () => {
    it('should create a payment', async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-PMT-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoice.id,
          amount: 100,
          paymentDate: new Date().toISOString(),
          method: 'CASH',
          referenceNo: 'REF-001',
          remarks: 'Test payment',
        })
        .expect(201);

      expect(response.body.data.amount).toBe('100');
      expect(response.body.data.method).toBe('CASH');
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.invoice).toBeDefined();
    });

    it('should list payments for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return payment detail', async () => {
      const payment = await prisma.payment.findFirst({
        where: { tenantId: testTenantId },
      });

      const response = await request(app.getHttpServer())
        .get(`/payments/${payment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(payment.id);
    });
  });

  describe('Payment Allocation', () => {
    let invoiceId: string;
    let paymentId: string;

    beforeEach(async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-ALLOC-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });
      invoiceId = invoice.id;

      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId,
          clientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });
      paymentId = payment.id;
    });

    afterEach(async () => {
      try {
        await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
    });

    it('should allocate partial payment and transition to PARTIALLY_PAID', async () => {
      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '40',
        })
        .expect(201);

      expect(Number(response.body.data.invoice.paidAmount)).toBe(40);
      expect(Number(response.body.data.invoice.balanceAmount)).toBe(60);
      expect(response.body.data.invoice.status).toBe('PARTIALLY_PAID');
    });

    it('should allocate full payment and transition to PAID', async () => {
      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId,
          clientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '100',
        })
        .expect(201);

      expect(Number(response.body.data.invoice.paidAmount)).toBe(100);
      expect(Number(response.body.data.invoice.balanceAmount)).toBe(0);
      expect(response.body.data.invoice.status).toBe('PAID');
    });

    it('should reject over-allocation to invoice', async () => {
      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '150',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('exceeds invoice balance');
    });

    it('should reject over-allocation to payment', async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-OVER-PAY-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });

      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId: invoice.id,
          clientId,
          amount: 60,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoice.id,
          amount: '60',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoice.id,
          amount: '1',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('exceeds payment remaining balance');
    });

    it('should reject duplicate allocation', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '50',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '50',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already allocated');
    });

    it('should reject allocation to DRAFT invoice', async () => {
      const draftInvoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-DRAFT-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.DRAFT,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: draftInvoice.id,
          amount: '50',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('DRAFT');
    });

    it('should reject allocation to VOID invoice', async () => {
      const voidInvoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-VOID-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.VOID,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: voidInvoice.id,
          amount: '50',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot allocate payment to invoice with status VOID');
    });
  });

  describe('Payment Reversal', () => {
    let invoiceId: string;
    let paymentId: string;

    beforeEach(async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-REV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });
      invoiceId = invoice.id;

      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId,
          clientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });
      paymentId = payment.id;
    });

    afterEach(async () => {
      try {
        await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
    });

    it('should reverse payment and restore invoice balance', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '100',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      expect(Number(invoice.paidAmount)).toBe(0);
      expect(Number(invoice.balanceAmount)).toBe(100);
      expect(invoice.status).toBe(InvoiceStatus.ISSUED);

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      expect(payment.status).toBe(PaymentStatus.REVERSED);
    });

    it('should void payment and restore invoice balance', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '100',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/void`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      expect(Number(invoice.paidAmount)).toBe(0);
      expect(Number(invoice.balanceAmount)).toBe(100);
      expect(invoice.status).toBe(InvoiceStatus.ISSUED);

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      expect(payment.status).toBe(PaymentStatus.VOID);
    });

    it('should reject reversal of already reversed payment', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: '100',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot reverse payment with status REVERSED');
    });
  });

  describe('AR Summary', () => {
    beforeEach(async () => {
      const invoiceData = [
        {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AR-1-${Date.now()}`,
          issueDate: new Date(Date.now() - 86400000 * 5),
          dueDate: new Date(Date.now() - 86400000 * 2),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
        {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AR-2-${Date.now()}`,
          issueDate: new Date(Date.now() - 86400000 * 40),
          dueDate: new Date(Date.now() - 86400000 * 35),
          status: InvoiceStatus.PARTIALLY_PAID,
          subtotal: 200,
          tax: 0,
          discount: 0,
          total: 200,
          paidAmount: 50,
          balanceAmount: 150,
        },
        {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AR-3-${Date.now()}`,
          issueDate: new Date(Date.now() - 86400000 * 100),
          dueDate: new Date(Date.now() - 86400000 * 95),
          status: InvoiceStatus.PAID,
          subtotal: 300,
          tax: 0,
          discount: 0,
          total: 300,
          paidAmount: 300,
          balanceAmount: 0,
        },
        {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AR-4-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.DRAFT,
          subtotal: 400,
          tax: 0,
          discount: 0,
          total: 400,
          paidAmount: 0,
          balanceAmount: 400,
        },
        {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AR-5-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 15),
          status: InvoiceStatus.ISSUED,
          subtotal: 250,
          tax: 0,
          discount: 0,
          total: 250,
          paidAmount: 0,
          balanceAmount: 250,
        },
      ];

      for (const data of invoiceData) {
        await prisma.invoice.create({ data });
      }
    });

    afterEach(async () => {
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
    });

    it('should return AR summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/invoice/ar-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      console.log('AR SUMMARY DATA:', JSON.stringify(response.body.data, null, 2));

      expect(response.body.data.totalOutstanding).toBeGreaterThan(0);
      expect(response.body.data.totalOverdue).toBeGreaterThan(0);
      expect(response.body.data.currentReceivables).toBeGreaterThan(0);
      expect(response.body.data.partiallyPaid).toBe(1);
      expect(response.body.data.invoiceCount).toBe(4);
      expect(response.body.data.aging['0-30']).toBeGreaterThan(0);
      expect(response.body.data.aging['31-60']).toBeGreaterThan(0);
    });

    it('should exclude PAID and DRAFT invoices from outstanding', async () => {
      const response = await request(app.getHttpServer())
        .get('/invoice/ar-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const outstanding = response.body.data.totalOutstanding;
      expect(outstanding).toBeLessThan(1000);
    });
  });

  describe('Customer Ledger', () => {
    let invoiceId: string;

    beforeEach(async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-LEDGER-${Date.now()}`,
          issueDate: new Date(Date.now() - 86400000 * 40),
          dueDate: new Date(Date.now() - 86400000 * 35),
          status: InvoiceStatus.ISSUED,
          subtotal: 200,
          tax: 0,
          discount: 0,
          total: 200,
          paidAmount: 0,
          balanceAmount: 200,
        },
      });
      invoiceId = invoice.id;

      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId,
          clientId,
          amount: 150,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId,
          amount: 150,
          tenantId: testTenantId,
        },
      });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: 150,
          balanceAmount: 50,
          status: InvoiceStatus.PARTIALLY_PAID,
        },
      });
    });

    afterEach(async () => {
      try {
        await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
    });

    it('should return customer ledger', async () => {
      const response = await request(app.getHttpServer())
        .get(`/invoice/client-ledger/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].payments).toBeDefined();
      expect(response.body.data[0].balanceAmount).toBe(50);
    });

    it('should reject cross-tenant ledger access', async () => {
      const response = await request(app.getHttpServer())
        .get(`/invoice/client-ledger/${otherClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Tenant Isolation', () => {
    let otherInvoiceId: string;

    beforeEach(async () => {
      const otherInvoice = await prisma.invoice.create({
        data: {
          tenantId: otherTenantId,
          clientId: otherClientId,
          invoiceNumber: `INV-OTHER-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });
      otherInvoiceId = otherInvoice.id;
    });

    afterEach(async () => {
      try {
        await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.payment.deleteMany({ where: { tenantId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: { not: '' } } });
      } catch (error) {}
    });

    it('should not return payments from other tenant', async () => {
      const otherPayment = await prisma.payment.create({
        data: {
          tenantId: otherTenantId,
          invoiceId: otherInvoiceId,
          clientId: otherClientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = response.body.data.map((p: any) => p.id);
      expect(ids).not.toContain(otherPayment.id);
    });

    it('should block cross-tenant payment access', async () => {
      const otherPayment = await prisma.payment.create({
        data: {
          tenantId: otherTenantId,
          invoiceId: otherInvoiceId,
          clientId: otherClientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/payments/${otherPayment.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });

    it('should block cross-tenant allocation', async () => {
      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId: otherInvoiceId,
          clientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: otherInvoiceId,
          amount: '50',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Authorization', () => {
    let invoiceId: string;
    let paymentId: string;

    beforeEach(async () => {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: testTenantId,
          clientId,
          invoiceNumber: `INV-AUTH-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
          status: InvoiceStatus.ISSUED,
          subtotal: 100,
          tax: 0,
          discount: 0,
          total: 100,
          paidAmount: 0,
          balanceAmount: 100,
        },
      });
      invoiceId = invoice.id;

      const payment = await prisma.payment.create({
        data: {
          tenantId: testTenantId,
          invoiceId,
          clientId,
          amount: 100,
          paymentDate: new Date(),
          method: 'CASH',
          status: PaymentStatus.ACTIVE,
        },
      });
      paymentId = payment.id;
    });

    afterEach(async () => {
      try {
        await prisma.paymentAllocation.deleteMany({ where: { paymentId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
      try {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
      } catch (error) {}
      try {
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
      } catch (error) {}
    });

    it('should allow employee to view payments', async () => {
      await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);
    });

    it('should allow manager to allocate payments', async () => {
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/allocate`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          invoiceId,
          amount: '50',
        })
        .expect(201);
    });
  });
});
