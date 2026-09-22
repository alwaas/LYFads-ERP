import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { AccountType, NormalBalanceSide } from '@prisma/client';

describe('General Ledger E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  let tenantAAccountIds: Record<string, string>;
  let tenantBAccountIds: Record<string, string>;

  const adminTokenA = () =>
    jwtService.sign({
      sub: testData.tenantAAdmin.id,
      email: testData.tenantAAdmin.email,
      role: testData.tenantAAdmin.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAAdmin.fullName,
    });

  const adminTokenB = () =>
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

  const getAccountCodes = async (tenantId: string): Promise<Record<string, string>> => {
    const codes = ['1000', '1010', '1020', '1030', '2000', '2010', '2020', '3000', '4000', '5000', '5010'];
    const result: Record<string, string> = {};
    for (const code of codes) {
      const account = await prisma.account.findUnique({
        where: { code_tenantId: { code, tenantId } },
      });
      if (account) {
        result[code] = account.id;
      }
    }
    return result;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    testData = await setupTestDatabase();

    tenantAAccountIds = await getAccountCodes(testData.tenantA.id);
    tenantBAccountIds = await getAccountCodes(testData.tenantB.id);
  }, 90000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.journalEntryLine.deleteMany();
      await prisma.journalEntry.deleteMany();
      await prisma.fiscalYear.deleteMany();
      await prisma.activityLog.deleteMany();
    } catch (e) {
      void e;
    }
  });

  describe('Authentication & Authorization', () => {
    it('rejects unauthenticated access', async () => {
      await request(app.getHttpServer()).get('/finance/accounts').expect(401);
    });

    it('rejects EMPLOYEE role access', async () => {
      await request(app.getHttpServer())
        .get('/finance/accounts')
        .set('Authorization', `Bearer ${employeeToken()}`)
        .expect(403);
    });

    it('allows ADMIN access', async () => {
      await request(app.getHttpServer())
        .get('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);
    });
  });

  describe('Chart of Accounts', () => {
    it('returns default chart of accounts for tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.total).toBeGreaterThan(0);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data.some((a: any) => a.code === '1000' && a.name === 'Cash')).toBe(true);
    });

    it('isolates accounts by tenant', async () => {
      const resA = await request(app.getHttpServer())
        .get('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const resB = await request(app.getHttpServer())
        .get('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(200);

      const dataA = resA.body.data ?? resA.body;
      const dataB = resB.body.data ?? resB.body;

      expect(dataA.total).toBe(dataB.total);
    });

    it('creates a new account', async () => {
      const res = await request(app.getHttpServer())
        .post('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          code: '9000',
          name: 'Custom Account',
          type: 'ASSET',
          normalBalanceSide: 'DEBIT',
        })
        .expect(201);

      const account = res.body.data ?? res.body;
      expect(account.code).toBe('9000');
      expect(account.name).toBe('Custom Account');

      const stored = await prisma.account.findUnique({
        where: { code_tenantId: { code: '9000', tenantId: testData.tenantA.id } },
      });
      expect(stored).toBeTruthy();
    });

    it('rejects duplicate account code within same tenant', async () => {
      await request(app.getHttpServer())
        .post('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ code: '8000', name: 'Test 1', type: 'ASSET', normalBalanceSide: 'DEBIT' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/finance/accounts')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ code: '8000', name: 'Test 2', type: 'ASSET', normalBalanceSide: 'DEBIT' })
        .expect(409);
    });
  });

  describe('Journal Entry Validation', () => {
    it('rejects unbalanced journal entry (credits > debits)', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Test unbalanced JE',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '150.00' },
          ],
        })
        .expect(400);
    });

    it('rejects unbalanced journal entry (debits > credits)', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Test unbalanced JE',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '150.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '100.00' },
          ],
        })
        .expect(400);
    });

    it('rejects journal entry with fewer than 2 lines', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Test single line JE',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00' },
          ],
        })
        .expect(400);
    });

    it('rejects a line with both debit and credit', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Test both debit and credit',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00', creditAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '100.00' },
          ],
        })
        .expect(400);
    });

    it('rejects duplicate referenceId', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'First JE',
          posted: true,
          referenceId: 'test-ref-001',
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '100.00' },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Duplicate ref',
          posted: true,
          referenceId: 'test-ref-001',
          lines: [
            { accountId: tenantAAccountIds['2000'], debitAmount: '50.00' },
            { accountId: tenantAAccountIds['5010'], creditAmount: '50.00' },
          ],
        })
        .expect(409);
    });
  });

  describe('Journal Entry CRUD', () => {
    it('creates a balanced journal entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Manual test entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], description: 'Bank deposit', debitAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], description: 'Service revenue', creditAmount: '100.00' },
          ],
        })
        .expect(201);

      const body = res.body.data ?? res.body;
      expect(body.description).toBe('Manual test entry');
      expect(body.posted).toBe(true);
      expect(body.lines).toHaveLength(2);
      expect(parseFloat(body.lines[0].debitAmount)).toBe(100);
      expect(parseFloat(body.lines[1].creditAmount)).toBe(100);

      const stored = await prisma.journalEntry.findUnique({
        where: { id: body.id },
        include: { lines: true },
      });
      expect(stored).toBeTruthy();
      expect(stored.lines).toHaveLength(2);
    });

    it('lists journal entries', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Listed JE',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '200.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '200.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('filters journal entries by posted status', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Unposted JE',
          posted: false,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '50.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '50.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/journal-entries?posted=false')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.data.every((e: any) => e.posted === false)).toBe(true);
    });
  });

  describe('Trial Balance Report', () => {
    it('returns empty balances when no entries exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/finance/trial-balance')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.accounts.length).toBeGreaterThan(0);
      expect(data.totalAssets).toBe(0);
      expect(data.totalRevenue).toBe(0);
    });

    it('computes trial balance after posting entries', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Revenue entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1010'], debitAmount: '500.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '500.00' },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Expense entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['5010'], debitAmount: '200.00' },
            { accountId: tenantAAccountIds['1000'], creditAmount: '200.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/trial-balance')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      const arAccount = data.accounts.find((a: any) => a.code === '1010');
      const revenueAccount = data.accounts.find((a: any) => a.code === '4000');
      const expenseAccount = data.accounts.find((a: any) => a.code === '5010');
      const cashAccount = data.accounts.find((a: any) => a.code === '1000');

      expect(parseFloat(arAccount.balance)).toBe(500);
      expect(parseFloat(revenueAccount.balance)).toBe(500);
      expect(parseFloat(expenseAccount.balance)).toBe(-200);
      expect(parseFloat(cashAccount.balance)).toBe(-200);

      expect(data.totalRevenue).toBe(500);
      expect(data.totalExpenses).toBe(200);
    });

    it('isolates trial balance by tenant', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Tenant A entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1010'], debitAmount: '1000.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '1000.00' },
          ],
        })
        .expect(201);

      const resB = await request(app.getHttpServer())
        .get('/finance/trial-balance')
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(200);

      const dataB = resB.body.data ?? resB.body;
      expect(dataB.totalRevenue).toBe(0);
    });
  });

  describe('Profit & Loss Report', () => {
    it('returns zero P&L when no entries exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/finance/profit-loss')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.totalRevenue).toBe(0);
      expect(data.totalExpenses).toBe(0);
      expect(data.netIncome).toBe(0);
    });

    it('computes P&L with revenue and expenses', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Revenue',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1010'], debitAmount: '1000.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '1000.00' },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Expense',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['5010'], debitAmount: '300.00' },
            { accountId: tenantAAccountIds['1000'], creditAmount: '300.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/profit-loss')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.totalRevenue).toBe(1000);
      expect(data.totalExpenses).toBe(300);
      expect(data.netIncome).toBe(700);
    });
  });

  describe('General Ledger Report', () => {
    it('returns general ledger entries', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'GL test entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], description: 'Cash inflow', debitAmount: '500.00' },
            { accountId: tenantAAccountIds['4000'], description: 'Revenue', creditAmount: '500.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/general-ledger')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const entries = res.body.data ?? res.body;
      expect(entries.length).toBeGreaterThanOrEqual(2);

      const cashEntry = entries.find(
        (e: any) => e.accountCode === '1000' && e.description === 'Cash inflow',
      );
      expect(cashEntry).toBeTruthy();
      expect(cashEntry.debitAmount).toBe(500);
    });

    it('isolates general ledger by tenant', async () => {
      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Tenant A entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '100.00' },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/general-ledger')
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(200);

      const entries = res.body.data ?? res.body;
      expect(entries.length).toBe(0);
    });
  });

  describe('Posting Hooks - Invoice (AR)', () => {
    jest.setTimeout(15000);
    it('creates AR journal entry when invoice is posted (status=SENT)', async () => {
      const res = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          invoiceNumber: `GL-AR-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: '500.00',
          tax: '0',
          discount: '0',
          total: '500.00',
          paidAmount: '0',
          balanceAmount: '500.00',
          status: 'SENT',
        })
        .expect(201);

      const invoice = res.body.data ?? res.body;

      const je = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `invoice_${invoice.id}`,
        },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je.posted).toBe(true);

      const debitLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1010']);
      const creditLine = je.lines.find((l) => l.accountId === tenantAAccountIds['4000']);
      expect(debitLine).toBeTruthy();
      expect(parseFloat(debitLine.debitAmount)).toBe(500);
      expect(creditLine).toBeTruthy();
      expect(parseFloat(creditLine.creditAmount)).toBe(500);
    });
  });

  describe('Posting Hooks - Customer Payment (AR)', () => {
    jest.setTimeout(15000);
    it('creates bank/AR journal entry when customer payment is received', async () => {
       await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          invoiceNumber: `GL-AR-PAY-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: '300.00',
          tax: '0',
          discount: '0',
          total: '300.00',
          paidAmount: '0',
          balanceAmount: '300.00',
          status: 'SENT',
        })
        .expect(201);

      const invoiceRes = await prisma.invoice.findFirst({
        where: { tenantId: testData.tenantA.id, status: 'SENT' as any },
        orderBy: { createdAt: 'desc' },
      });
      expect(invoiceRes).toBeTruthy();

      const paymentRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          invoiceId: invoiceRes.id,
          amount: '300.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'BANK_TRANSFER',
        })
        .expect(201);

      const payment = paymentRes.body.data ?? paymentRes.body;

      const je = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `payment_${payment.id}`,
        },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je.posted).toBe(true);

      const debitLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      const creditLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1010']);
      expect(debitLine).toBeTruthy();
      expect(parseFloat(debitLine.debitAmount)).toBe(300);
      expect(creditLine).toBeTruthy();
      expect(parseFloat(creditLine.creditAmount)).toBe(300);
    });
  });

  describe('Posting Hooks - Vendor Bill (AP)', () => {
    jest.setTimeout(15000);
    it('creates AP journal entry when vendor bill is posted', async () => {
      const billRes = await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          invoiceNumber: `GL-AP-${Date.now()}`,
          vendorId: (await prisma.vendor.findFirst({ where: { tenantId: testData.tenantA.id }, select: { id: true } })).id,
          dueDate: new Date().toISOString().split('T')[0],
          items: [{ description: 'Test item', quantity: '2', unitCost: '50.00' }],
        })
        .expect(201);

      const bill = billRes.body.data ?? billRes.body;

      await request(app.getHttpServer())
        .post(`/purchase-invoices/${bill.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `bill_${bill.id}`,
        },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je.posted).toBe(true);

      const debitLine = je.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const creditLine = je.lines.find((l) => l.accountId === tenantAAccountIds['2000']);
      expect(debitLine).toBeTruthy();
      expect(parseFloat(debitLine.debitAmount)).toBe(100);
      expect(creditLine).toBeTruthy();
      expect(parseFloat(creditLine.creditAmount)).toBe(100);
    });
  });

  describe('Posting Hooks - Vendor Payment (AP)', () => {
    jest.setTimeout(15000);
    it('creates AP reversal journal entry when vendor payment is made', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { tenantId: testData.tenantA.id },
        select: { id: true },
      });

      const billRes = await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          invoiceNumber: `GL-AP-PAY-${Date.now()}`,
          vendorId: vendor.id,
          dueDate: new Date().toISOString().split('T')[0],
          items: [{ description: 'Test item', quantity: '1', unitCost: '200.00' }],
        })
        .expect(201);

      const bill = billRes.body.data ?? billRes.body;

      await request(app.getHttpServer())
        .post(`/purchase-invoices/${bill.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const paymentRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          purchaseInvoiceId: bill.id,
          amount: '200.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'BANK_TRANSFER',
        })
        .expect(201);

      const payment = paymentRes.body.data ?? paymentRes.body;

      const je = await prisma.journalEntry.findFirst({
        where: {
          tenantId: testData.tenantA.id,
          referenceId: `vendor_payment_${payment.id}`,
        },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je.posted).toBe(true);

      const debitLine = je.lines.find((l) => l.accountId === tenantAAccountIds['2000']);
      const creditLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(debitLine).toBeTruthy();
      expect(parseFloat(debitLine.debitAmount)).toBe(200);
      expect(creditLine).toBeTruthy();
      expect(parseFloat(creditLine.creditAmount)).toBe(200);
    });
  });

  describe('Transaction Rollback', () => {
    it('rolls back journal entry creation if balance check fails in transaction', async () => {
      const beforeCount = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id },
      });

      await request(app.getHttpServer())
        .post('/finance/journal-entries')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          description: 'Unbalanced entry',
          posted: true,
          lines: [
            { accountId: tenantAAccountIds['1000'], debitAmount: '100.00' },
            { accountId: tenantAAccountIds['4000'], creditAmount: '100.00' },
            { accountId: tenantAAccountIds['2000'], debitAmount: '50.00' },
          ],
        })
        .expect(400);

      const afterCount = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id },
      });
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('Fiscal Year', () => {
    it('creates and lists fiscal years', async () => {
      await request(app.getHttpServer())
        .post('/finance/fiscal-years')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          year: 2025,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/finance/fiscal-years')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const data = res.body.data ?? res.body;
      expect(data.some((fy: any) => fy.year === 2025)).toBe(true);
    });
  });
});
