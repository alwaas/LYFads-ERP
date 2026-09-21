import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { GlService } from '../src/modules/gl/gl.service';
import { AccountType, NormalBalanceSide } from '@prisma/client';

describe('Phase 2 GL Reversals & Financial Integrity E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let glService: GlService;
  let testData: any;
  let tenantAccountIds: Record<string, string>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    glService = app.get<GlService>(GlService);

    testData = await setupTestDatabase();

    // Ensure default chart of accounts for tenantA, including 5050
    await glService.ensureDefaultAccounts(testData.tenantA.id);

    // Make sure 5050 exists
    await prisma.account.upsert({
      where: { code_tenantId: { code: '5050', tenantId: testData.tenantA.id } },
      update: {},
      create: {
        code: '5050',
        name: 'Inventory Adjustments',
        type: AccountType.EXPENSE,
        normalBalanceSide: NormalBalanceSide.DEBIT,
        isActive: true,
        tenantId: testData.tenantA.id,
      },
    });

    // Cache account IDs for tenantA
    const codes = ['1000', '1010', '1020', '2000', '2020', '4000', '5010', '5050'];
    tenantAccountIds = {};
    for (const code of codes) {
      const acc = await prisma.account.findUnique({
        where: { code_tenantId: { code, tenantId: testData.tenantA.id } },
      });
      if (acc) {
        tenantAccountIds[code] = acc.id;
      }
    }
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  const adminToken = () =>
    jwtService.sign({
      sub: testData.tenantAAdmin.id,
      email: testData.tenantAAdmin.email,
      role: testData.tenantAAdmin.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAAdmin.fullName,
    });

  describe('1. Customer Payment Voiding GL Reversal', () => {
    it('creates AR restoration and Bank reversal entries when customer payment is voided', async () => {
      // Create invoice
      const invoiceRes = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          tenantId: testData.tenantA.id,
          clientId: testData.tenantAClient.id,
          invoiceNumber: `INV-REV-${Date.now()}`,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          subtotal: '400.00',
          tax: '0',
          discount: '0',
          total: '400.00',
          paidAmount: '0',
          balanceAmount: '400.00',
          status: 'SENT',
        })
        .expect(201);

      const invoice = invoiceRes.body.data ?? invoiceRes.body;

      // Create payment
      const paymentRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          invoiceId: invoice.id,
          amount: '400.00',
          paymentDate: new Date().toISOString(),
          method: 'BANK_TRANSFER',
          referenceNo: `PAY-AR-${Date.now()}`,
        })
        .expect(201);

      const payment = paymentRes.body.data ?? paymentRes.body;

      // Void payment
      await request(app.getHttpServer())
        .post(`/payments/${payment.id}/void`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      // Verify reversal GL entry: DR AR (1010), CR Bank (1000)
      const reversalJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `payment_void_${payment.id}`,
        },
        include: { lines: true },
      });

      expect(reversalJe).toBeTruthy();
      expect(reversalJe!.posted).toBe(true);

      const arLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['1010']);
      const bankLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['1000']);

      expect(arLine).toBeTruthy();
      expect(parseFloat(arLine!.debitAmount.toString())).toBe(400);
      expect(bankLine).toBeTruthy();
      expect(parseFloat(bankLine!.creditAmount.toString())).toBe(400);
    });
  });

  describe('2. Vendor Payment Voiding GL Reversal', () => {
    it('creates Bank restoration and AP reversal entries when vendor payment is voided', async () => {
      // Create vendor bill
      const billRes = await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          vendorId: testData.tenantAVendor.id,
          invoiceNumber: `BILL-PAY-${Date.now()}`,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          items: [
            {
              description: 'Consulting services',
              quantity: '1',
              unitCost: '600.00',
              tax: '0',
              discount: '0',
              lineTotal: '600.00',
            },
          ],
        })
        .expect(201);

      const bill = billRes.body.data ?? billRes.body;

      // Post vendor bill
      await request(app.getHttpServer())
        .post(`/purchase-invoices/${bill.id}/post`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      // Create vendor payment
      const paymentRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          purchaseInvoiceId: bill.id,
          amount: '600.00',
          paymentDate: new Date().toISOString(),
          method: 'BANK_TRANSFER',
          referenceNo: `PAY-AP-${Date.now()}`,
        })
        .expect(201);

      const payment = paymentRes.body.data ?? paymentRes.body;

      // Void payment
      await request(app.getHttpServer())
        .post(`/payments/${payment.id}/void`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      // Verify reversal GL entry: DR Bank (1000), CR AP (2000)
      const reversalJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `payment_void_${payment.id}`,
        },
        include: { lines: true },
      });

      expect(reversalJe).toBeTruthy();
      expect(reversalJe!.posted).toBe(true);

      const bankLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['1000']);
      const apLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['2000']);

      expect(bankLine).toBeTruthy();
      expect(parseFloat(bankLine!.debitAmount.toString())).toBe(600);
      expect(apLine).toBeTruthy();
      expect(parseFloat(apLine!.creditAmount.toString())).toBe(600);
    });
  });

  describe('3. Invoice Cancellation GL Reversal', () => {
    it('creates Revenue/Tax debit and AR credit entries when invoice is cancelled', async () => {
      const invoiceRes = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          tenantId: testData.tenantA.id,
          clientId: testData.tenantAClient.id,
          invoiceNumber: `INV-CAN-${Date.now()}`,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          subtotal: '500.00',
          tax: '50.00',
          discount: '0',
          total: '550.00',
          paidAmount: '0',
          balanceAmount: '550.00',
          status: 'SENT',
        })
        .expect(201);

      const invoice = invoiceRes.body.data ?? invoiceRes.body;

      // Cancel invoice
      await request(app.getHttpServer())
        .patch(`/invoice/${invoice.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      // Verify reversal GL entry: DR Revenue (4000), DR Tax (2020), CR AR (1010)
      const reversalJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `invoice_cancel_${invoice.id}`,
        },
        include: { lines: true },
      });

      expect(reversalJe).toBeTruthy();
      expect(reversalJe!.posted).toBe(true);

      const revLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['4000']);
      const taxLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['2020']);
      const arLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['1010']);

      expect(revLine).toBeTruthy();
      expect(parseFloat(revLine!.debitAmount.toString())).toBe(500);
      expect(taxLine).toBeTruthy();
      expect(parseFloat(taxLine!.debitAmount.toString())).toBe(50);
      expect(arLine).toBeTruthy();
      expect(parseFloat(arLine!.creditAmount.toString())).toBe(550);
    });
  });

  describe('4. Vendor Bill Cancellation/Void GL Reversal', () => {
    it('creates AP debit and Expense/Tax credit entries when vendor bill is cancelled or voided', async () => {
      const billRes = await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          vendorId: testData.tenantAVendor.id,
          invoiceNumber: `BILL-CAN-${Date.now()}`,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          items: [
            {
              description: 'Software licenses',
              quantity: '2',
              unitCost: '300.00',
              tax: '60.00',
              discount: '0',
              lineTotal: '660.00',
            },
          ],
        })
        .expect(201);

      const bill = billRes.body.data ?? billRes.body;

      // Post bill
      await request(app.getHttpServer())
        .post(`/purchase-invoices/${bill.id}/post`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      // Cancel bill
      await request(app.getHttpServer())
        .post(`/purchase-invoices/${bill.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      // Verify reversal GL entry: DR AP (2000), CR Expense (5010), CR Tax (2020)
      const reversalJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `bill_cancel_${bill.id}`,
        },
        include: { lines: true },
      });

      expect(reversalJe).toBeTruthy();
      expect(reversalJe!.posted).toBe(true);

      const apLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['2000']);
      const expLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['5010']);
      const taxLine = reversalJe!.lines.find((l) => l.accountId === tenantAccountIds['2020']);

      expect(apLine).toBeTruthy();
      expect(parseFloat(apLine!.debitAmount.toString())).toBe(660);
      expect(expLine).toBeTruthy();
      expect(parseFloat(expLine!.creditAmount.toString())).toBe(600);
      expect(taxLine).toBeTruthy();
      expect(parseFloat(taxLine!.creditAmount.toString())).toBe(60);
    });
  });

  describe('5. Stock Count Variance Adjustments GL Entries', () => {
    it('creates DR Inventory Asset (1020) / CR Inventory Adjustments (5050) on positive variance', async () => {
      // Set initial product warehouse quantity = 10, cost = 25
      const pw = await prisma.productWarehouse.upsert({
        where: {
          productId_warehouseId: {
            productId: testData.tenantAProduct.id,
            warehouseId: testData.tenantAWarehouse.id,
          },
        },
        update: { quantity: 10, averageCost: 25 },
        create: {
          productId: testData.tenantAProduct.id,
          warehouseId: testData.tenantAWarehouse.id,
          quantity: 10,
          averageCost: 25,
          tenantId: testData.tenantA.id,
        },
      });

      // Count shows 15 (variance = +5)
      const draftRes = await request(app.getHttpServer())
        .post('/stock-counts')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          lines: [
            {
              productId: testData.tenantAProduct.id,
              countedQuantity: 15,
            },
          ],
        })
        .expect(201);

      const count = draftRes.body.data ?? draftRes.body;

      // Approve count
      await request(app.getHttpServer())
        .post(`/stock-counts/${count.id}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      // Verify GL adjustment entry
      const line = count.lines[0];
      const adjJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `stock_count_adj_${count.id}_${line.id}`,
        },
        include: { lines: true },
      });

      expect(adjJe).toBeTruthy();
      expect(adjJe!.posted).toBe(true);

      const invLine = adjJe!.lines.find((l) => l.accountId === tenantAccountIds['1020']);
      const adjLine = adjJe!.lines.find((l) => l.accountId === tenantAccountIds['5050']);

      expect(invLine).toBeTruthy();
      expect(parseFloat(invLine!.debitAmount.toString())).toBe(125); // 5 * 25
      expect(adjLine).toBeTruthy();
      expect(parseFloat(adjLine!.creditAmount.toString())).toBe(125);
    });

    it('creates DR Inventory Adjustments (5050) / CR Inventory Asset (1020) on negative variance', async () => {
      // Current quantity is now 15 at tenantAWarehouse, average cost 25
      // Count shows 10 (variance = -5)
      const draftRes = await request(app.getHttpServer())
        .post('/stock-counts')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          warehouseId: testData.tenantAWarehouse.id,
          lines: [
            {
              productId: testData.tenantAProduct.id,
              countedQuantity: 10,
            },
          ],
        })
        .expect(201);

      const count = draftRes.body.data ?? draftRes.body;

      // Approve count
      await request(app.getHttpServer())
        .post(`/stock-counts/${count.id}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      // Verify GL adjustment entry
      const line = count.lines[0];
      const adjJe = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `stock_count_adj_${count.id}_${line.id}`,
        },
        include: { lines: true },
      });

      expect(adjJe).toBeTruthy();
      expect(adjJe!.posted).toBe(true);

      const adjLine = adjJe!.lines.find((l) => l.accountId === tenantAccountIds['5050']);
      const invLine = adjJe!.lines.find((l) => l.accountId === tenantAccountIds['1020']);

      expect(adjLine).toBeTruthy();
      expect(parseFloat(adjLine!.debitAmount.toString())).toBe(125);
      expect(invLine).toBeTruthy();
      expect(parseFloat(invLine!.creditAmount.toString())).toBe(125);
    });
  });

  describe('6. Idempotency Verification', () => {
    it('does not create duplicate GL reversal entries if already approved or voided', async () => {
      // Re-approving stock count returns alreadyApproved: true without extra entries
      const count = await prisma.stockCount.findFirst({
        where: { tenantId: testData.tenantA.id, status: 'APPROVED' },
        include: { lines: true },
      });

      const reApproveRes = await request(app.getHttpServer())
        .post(`/stock-counts/${count!.id}/approve`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(201);

      const body = reApproveRes.body.data ?? reApproveRes.body;
      expect(body.alreadyApproved).toBe(true);

      const countJes = await prisma.journalEntry.count({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `stock_count_adj_${count!.id}_${count!.lines[0].id}`,
        },
      });
      expect(countJes).toBe(1);
    });
  });
});
