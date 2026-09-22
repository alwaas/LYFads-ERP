import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Expense GL Posting Foundation E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  let tenantAAccountIds: Record<string, string>;

  const adminTokenA = () =>
    jwtService.sign({
      sub: testData.tenantAAdmin.id,
      email: testData.tenantAAdmin.email,
      role: testData.tenantAAdmin.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAAdmin.fullName,
    });

  const getAccountCodes = async (
    tenantId: string,
  ): Promise<Record<string, string>> => {
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
  }, 90000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.journalEntryLine.deleteMany();
      await prisma.journalEntry.deleteMany();
    } catch (e) {
      void e;
    }
  });

  describe('Expense CREATE does not post to GL', () => {
    it('creates expense without creating a journal entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({
          expenseDate: new Date().toISOString().split('T')[0],
          category: 'Office Supplies',
          description: 'Direct-paid expense - no GL on create',
          amount: '50.00',
          paymentMethod: 'CASH',
          vendorId: null,
        })
        .expect(201);

      const expense = res.body.data ?? res.body;

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeNull();
    });
  });

  describe('ExpensesService.postToLedger', () => {
    it('posts a direct-paid expense (DR Expense 5010 / CR Cash 1000)', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Office Supplies',
          description: 'Direct-paid expense',
          amount: 100,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je.posted).toBe(true);

      const expenseLine = je.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const cashLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine.debitAmount)).toBe(100);
      expect(cashLine).toBeTruthy();
      expect(parseFloat(cashLine.creditAmount)).toBe(100);

      // Balanced entry check
      const totalDebit = je.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
      const totalCredit = je.lines.reduce((s, l) => s + Number(l.creditAmount), 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('posts a vendor/payable expense (DR Expense 5010 / CR Accounts Payable 2000)', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Consulting',
          description: 'Vendor payable expense',
          amount: 250,
          paymentMethod: 'BANK_TRANSFER',
          vendorId: testData.tenantAVendor.id,
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const expenseLine = je.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const apLine = je.lines.find((l) => l.accountId === tenantAAccountIds['2000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine.debitAmount)).toBe(250);
      expect(apLine).toBeTruthy();
      expect(parseFloat(apLine.creditAmount)).toBe(250);

      const totalDebit = je.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
      const totalCredit = je.lines.reduce((s, l) => s + Number(l.creditAmount), 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('includes tax amount in posting when provided', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Utilities',
          description: 'Utility bill with tax',
          amount: 100,
          taxAmount: 10,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const expenseLine = je.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const cashLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine.debitAmount)).toBe(110);
      expect(cashLine).toBeTruthy();
      expect(parseFloat(cashLine.creditAmount)).toBe(110);
    });

    it('uses custom glAccountId when provided', async () => {
      const customAccount = await prisma.account.create({
        data: {
          code: '6000',
          name: 'Travel Expenses',
          type: 'EXPENSE',
          normalBalanceSide: 'DEBIT',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Travel',
          description: 'Custom GL account expense',
          amount: 75,
          paymentMethod: 'CARD',
          glAccountId: customAccount.id,
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const customLine = je.lines.find((l) => l.accountId === customAccount.id);
      expect(customLine).toBeTruthy();
      expect(parseFloat(customLine.debitAmount)).toBe(75);

      const cashLine = je.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(cashLine).toBeTruthy();
      expect(parseFloat(cashLine.creditAmount)).toBe(75);
    });
  });

  describe('Duplicate posting protection', () => {
    it('rejects duplicate expense posting (same referenceId)', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Office Supplies',
          description: 'Duplicate test expense',
          amount: 200,
          paymentMethod: 'CASH',
          tenantId: testData.tenantA.id,
        },
      });

      // First posting succeeds
      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      // Second posting with same referenceId fails (duplicate-safe)
      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(409);

      // Verify exactly 1 journal entry exists
      const count = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
      });
      expect(count).toBe(1);
    });
  });

  describe('Tenant isolation', () => {
    it('requires the expense to belong to the authenticated tenant', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date(),
          category: 'Test',
          description: 'Tenant B expense',
          amount: 50,
          paymentMethod: 'CASH',
          tenantId: testData.tenantB.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(403);

      const je = await prisma.journalEntry.findFirst({
        where: { referenceId: `expense_${expense.id}` },
      });
      expect(je).toBeNull();
    });
  });
});
