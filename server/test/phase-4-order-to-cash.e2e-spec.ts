import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { PaymentMethod } from '@prisma/client';

describe('Phase 4 Order-to-Cash Lifecycle (Sales Order -> Invoice -> AR -> Payment -> GL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  const tenantAToken = () =>
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

  const unwrap = (res: request.Response) => res.body.data ?? res.body;

  let createdSalesOrderId: string;
  let createdInvoiceId: string;

  describe('1. Sales Order Creation & Confirmation', () => {
    it('creates a sales order with line items in DRAFT status', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          orderNumber: 'SO-O2C-1001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '1000.00',
          discount: '50.00',
          tax: '171.00',
          total: '1121.00',
          notes: 'Order to cash test order',
          items: [
            {
              productId: testData.tenantAProduct.id,
              quantity: '5.00',
              unitPrice: '200.00',
              discount: '50.00',
              tax: '171.00',
              lineTotal: '1121.00',
            },
          ],
        });

      expect(response.status).toBe(201);
      const data = unwrap(response);
      expect(data.orderNumber).toBe('SO-O2C-1001');
      expect(data.status).toBe('DRAFT');
      expect(data.items).toHaveLength(1);
      expect(data.items[0].productId).toBe(testData.tenantAProduct.id);

      createdSalesOrderId = data.id;
    });

    it('confirms the sales order transitioning from DRAFT to CONFIRMED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${createdSalesOrderId}/confirm`)
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({});

      expect(response.status).toBe(201);
      const data = unwrap(response);
      expect(data.status).toBe('CONFIRMED');
    });
  });

  describe('2. Convert Sales Order to Invoice & GL Posting', () => {
    it('converts CONFIRMED sales order to invoice and posts AR / Revenue to GL', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${createdSalesOrderId}/create-invoice`)
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          notes: 'Customer billed from SO-O2C-1001',
        });

      expect(response.status).toBe(201);
      const invoice = unwrap(response);

      expect(invoice.salesOrderId).toBe(createdSalesOrderId);
      expect(invoice.clientId).toBe(testData.tenantAClient.id);
      expect(Number(invoice.total)).toBe(1121);
      expect(Number(invoice.subtotal)).toBe(1000);
      expect(Number(invoice.tax)).toBe(171);
      expect(Number(invoice.discount)).toBe(50);
      expect(invoice.status).toBe('SENT');
      expect(invoice.items).toBeDefined();
      expect(invoice.items.length).toBeGreaterThanOrEqual(1);

      createdInvoiceId = invoice.id;

      // Verify sales order status transitioned to INVOICED
      const updatedOrder = await prisma.salesOrder.findUnique({
        where: { id: createdSalesOrderId },
      });
      expect(updatedOrder!.status).toBe('INVOICED');

      // Verify GL entries were posted for the invoice
      const journalEntry = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `invoice_${invoice.id}`,
        },
        include: { lines: { include: { account: true } } },
      });

      expect(journalEntry).toBeDefined();
      expect(journalEntry!.posted).toBe(true);

      // Debit AR (1010) = 1121
      const arLine = journalEntry!.lines.find((l) => l.account.code === '1010');
      expect(arLine).toBeDefined();
      expect(Number(arLine!.debitAmount)).toBe(1121);

      // Credit Revenue (4000)
      const revLine = journalEntry!.lines.find((l) => l.account.code === '4000');
      expect(revLine).toBeDefined();
      expect(Number(revLine!.creditAmount)).toBeGreaterThan(0);

      // Credit Tax (2020) = 171
      const taxLine = journalEntry!.lines.find((l) => l.account.code === '2020');
      expect(taxLine).toBeDefined();
      expect(Number(taxLine!.creditAmount)).toBe(171);
    });

    it('prevents converting an already INVOICED sales order with 409 Conflict', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${createdSalesOrderId}/create-invoice`)
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already been invoiced');
    });

    it('displays the linked invoice when fetching the sales order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sales-orders/${createdSalesOrderId}`)
        .set('Authorization', `Bearer ${tenantAToken()}`);

      expect(response.status).toBe(200);
      const data = unwrap(response);
      expect(data.invoices).toBeDefined();
      expect(data.invoices.length).toBeGreaterThanOrEqual(1);
      expect(data.invoices[0].id).toBe(createdInvoiceId);
    });

    it('displays the linked sales order when fetching the invoice', async () => {
      const response = await request(app.getHttpServer())
        .get(`/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${tenantAToken()}`);

      expect(response.status).toBe(200);
      const data = unwrap(response);
      expect(data.salesOrder).toBeDefined();
      expect(data.salesOrder.id).toBe(createdSalesOrderId);
    });
  });

  describe('3. Order-to-Cash Completion: Payment & AR Clearing', () => {
    it('records customer payment against the invoice and clears AR via GL', async () => {
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          invoiceId: createdInvoiceId,
          amount: '1121.00',
          method: PaymentMethod.BANK_TRANSFER,
          paymentDate: new Date().toISOString(),
          referenceNo: 'BANK-REF-O2C-001',
          remarks: 'Full payment for SO-O2C-1001 invoice',
        });

      expect(paymentResponse.status).toBe(201);
      const payment = unwrap(paymentResponse);

      // Verify invoice balance and status
      const paidInvoice = await prisma.invoice.findUnique({
        where: { id: createdInvoiceId },
      });
      expect(Number(paidInvoice!.paidAmount)).toBe(1121);
      expect(Number(paidInvoice!.balanceAmount)).toBe(0);
      expect(paidInvoice!.status).toBe('PAID');

      // Verify GL entries posted for payment: Debit Bank (1000), Credit AR (1010)
      const paymentJournal = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `payment_${payment.id}`,
        },
        include: { lines: { include: { account: true } } },
      });

      expect(paymentJournal).toBeDefined();
      expect(paymentJournal!.posted).toBe(true);

      const bankLine = paymentJournal!.lines.find((l) => l.account.code === '1000');
      expect(bankLine).toBeDefined();
      expect(Number(bankLine!.debitAmount)).toBe(1121);

      const arLine = paymentJournal!.lines.find((l) => l.account.code === '1010');
      expect(arLine).toBeDefined();
      expect(Number(arLine!.creditAmount)).toBe(1121);
    });
  });

  describe('4. Tenant Isolation & SaaS Entitlement Enforcement', () => {
    it('blocks tenant B from creating an invoice from tenant A sales order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${createdSalesOrderId}/create-invoice`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({});

      expect([403, 404]).toContain(response.status);
    });

    it('enforces MAX_INVOICES plan limit when converting a sales order', async () => {
      // Create another sales order for tenant A
      const soRes = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          orderNumber: 'SO-O2C-LIMIT-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '500.00',
          total: '500.00',
          items: [
            {
              productId: testData.tenantAProduct.id,
              quantity: '2.00',
              unitPrice: '250.00',
              lineTotal: '500.00',
            },
          ],
        });
      expect(soRes.status).toBe(201);
      const soData = unwrap(soRes);
      const secondSalesOrderId = soData.id;

      // Count current invoices for tenant A
      const currentInvoices = await prisma.invoice.count({
        where: { tenantId: testData.tenantA.id },
      });

      // Restrict MAX_INVOICES limit to current invoice count
      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_INVOICES',
          },
        },
        update: { limitValue: currentInvoices },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_INVOICES',
          limitValue: currentInvoices,
        },
      });

      // Attempting to convert should fail with 403 Forbidden
      const convertRes = await request(app.getHttpServer())
        .post(`/sales-orders/${secondSalesOrderId}/create-invoice`)
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({});

      expect(convertRes.status).toBe(403);
      expect(convertRes.body.message).toContain('Plan limit reached for MAX_INVOICES');
    });

    it('supports alias route POST /sales-orders/:id/convert-to-invoice', async () => {
      // Restore plan limit
      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });
      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_INVOICES',
          },
        },
        update: { limitValue: 1000 },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_INVOICES',
          limitValue: 1000,
        },
      });

      // Create a third sales order
      const soRes = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          orderNumber: 'SO-O2C-ALIAS-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '300.00',
          total: '300.00',
          items: [
            {
              productId: testData.tenantAProduct.id,
              quantity: '1.00',
              unitPrice: '300.00',
              lineTotal: '300.00',
            },
          ],
        });
      expect(soRes.status).toBe(201);
      const soData = unwrap(soRes);
      const thirdOrderId = soData.id;

      // Call convert-to-invoice
      const convertRes = await request(app.getHttpServer())
        .post(`/sales-orders/${thirdOrderId}/convert-to-invoice`)
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          notes: 'Converted via alias endpoint',
        });

      expect(convertRes.status).toBe(201);
      const invData = unwrap(convertRes);
      expect(invData.salesOrderId).toBe(thirdOrderId);
      expect(invData.notes).toBe('Converted via alias endpoint');

      const updatedOrder = await prisma.salesOrder.findUnique({
        where: { id: thirdOrderId },
      });
      expect(updatedOrder!.status).toBe('INVOICED');
    });
  });
});
