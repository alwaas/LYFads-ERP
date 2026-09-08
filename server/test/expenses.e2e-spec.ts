import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { ExpenseStatus } from '@prisma/client';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Expenses Workflow State Machine E2E', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;
  let tenantAAccountIds: Record<string, string>;

  const generateToken = (user: any) =>
    jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });

  const adminTokenA = () => generateToken(testData.tenantAAdmin);
  const adminTokenB = () => generateToken(testData.tenantBAdmin);
  const managerTokenA = () => generateToken(testData.tenantAManager);
  const employeeTokenA = () => generateToken(testData.tenantAEmployee);
  const superAdminTokenA = () =>
    generateToken(testData.superAdmin);

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

  const createDraftExpense = (overrides: any = {}) => ({
    expenseDate: '2024-01-15',
    category: 'Office Supplies',
    description: 'Test expense',
    amount: '100.00',
    paymentMethod: 'CASH',
    ...overrides,
  });

  let expenseCounter = 0;
  const uniqueDescription = (prefix: string) =>
    `${prefix}_${Date.now()}_${expenseCounter++}`;

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
      await prisma.expense.deleteMany();
      await prisma.activityLog.deleteMany();
    } catch (e) {
      void e;
    }
  });

  describe('1. CREATE', () => {
    it('creates expense in DRAFT status by default', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send(createDraftExpense({ description: uniqueDescription('draft-expense') }))
        .expect(201);

      const expense = res.body.data;
      expect(expense.status).toBe(ExpenseStatus.DRAFT);
      expect(expense.tenantId).toBe(testData.tenantA.id);
    });

    it('computes total = amount + taxAmount when tax provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send(
          createDraftExpense({
            description: uniqueDescription('tax-expense'),
            amount: '200.00',
            taxAmount: '20.00',
          }),
        )
        .expect(201);

      const expense = res.body.data;
      expect(expense.total).toBeDefined();
      expect(parseFloat(expense.total)).toBe(220);
    });

    it('does not create a GL journal entry at DRAFT creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send(createDraftExpense({ description: uniqueDescription('no-gl-expense') }))
        .expect(201);

      const expense = res.body.data;
      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
      });
      expect(je).toBeNull();
    });
  });

  describe('2. VALID STATE MACHINE transitions', () => {
    it('DRAFT → SUBMITTED', async () => {
      const expense = await createExpenseInDb();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/submit`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.SUBMITTED);
    });

    it('SUBMITTED → APPROVED', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/submit`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.APPROVED);
    });

    it('APPROVED → POSTED (creates GL journal entry)', async () => {
      const expense = await createExpenseInDb();
      await submitAndApprove(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.POSTED);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je!.posted).toBe(true);
    });

    it('POSTED → PAID (full payment)', async () => {
      const expense = await createExpenseInDb({ amount: '150.00' });
      await submitAndApprove(expense.id);
      await postExpense(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '150.00' })
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.PAID);
      expect(parseFloat(res.body.data.amountPaid)).toBe(150);
      expect(parseFloat(res.body.data.balanceAmount)).toBeCloseTo(0, 5);
      expect(res.body.data.paidAt).toBeTruthy();
    });
  });

  describe('3. REJECT', () => {
    it('SUBMITTED → REJECTED', async () => {
      const expense = await createExpenseInDb();
      await submit(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/reject`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.REJECTED);
    });

    it('rejected expense cannot proceed to APPROVED', async () => {
      const expense = await createAndSubmitExpense();
      await rejectExpense(expense.id);

      const current = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(current!.status).toBe(ExpenseStatus.REJECTED);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);

      const unchanged = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(unchanged!.status).toBe(ExpenseStatus.REJECTED);
    });

    it('rejected expense cannot proceed to POSTED', async () => {
      const expense = await createAndSubmitExpense();
      await rejectExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('rejected expense cannot proceed to PAID', async () => {
      const expense = await createAndSubmitExpense();
      await rejectExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '100.00' })
        .expect(400);
    });
  });

  describe('4. CANCEL', () => {
    it('DRAFT → CANCELLED', async () => {
      const expense = await createExpenseInDb();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.CANCELLED);
    });

    it('SUBMITTED → CANCELLED', async () => {
      const expense = await createAndSubmitExpense();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.CANCELLED);
    });

    it('APPROVED → CANCELLED', async () => {
      const expense = await createAndSubmitExpense();
      await approveExpense(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      expect(res.body.data.status).toBe(ExpenseStatus.CANCELLED);
    });

    it('POSTED cannot be CANCELLED', async () => {
      const expense = await createAndSubmitExpense();
      await approveExpense(expense.id);
      await postExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);

      const unchanged = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(unchanged!.status).toBe(ExpenseStatus.POSTED);
    });

    it('PAID cannot be CANCELLED', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPostAndPay(expense.id, '100.00');

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('CANCELLED cannot be CANCELLED again', async () => {
      const expense = await createExpenseInDb();
      await cancelExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/cancel`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });
  });

  describe('5. INVALID TRANSITIONS', () => {
    it('DRAFT → APPROVED is rejected', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('DRAFT → POSTED is rejected', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('SUBMITTED → POSTED is rejected', async () => {
      const expense = await createAndSubmitExpense();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('POSTED → APPROVED is rejected', async () => {
      const expense = await createAndSubmitExpense();
      await approveExpense(expense.id);
      await postExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('PAID → POSTED is rejected', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPostAndPay(expense.id, '100.00');

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);
    });

    it('DRAFT → PAID is rejected', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '50.00' })
        .expect(400);
    });

    it('status remains unchanged on invalid transition', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);

      const unchanged = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(unchanged!.status).toBe(ExpenseStatus.DRAFT);
    });
  });

  describe('6. APPROVAL AUDIT', () => {
    it('sets approvedById and approvedAt on approval', async () => {
      const expense = await createAndSubmitExpense();

      const adminId = testData.tenantAAdmin.id;
      const before = new Date();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const approved = res.body.data;
      expect(approved.approvedById).toBe(adminId);
      expect(approved.approvedAt).toBeTruthy();
      const approvedAt = new Date(approved.approvedAt);
      expect(approvedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    });

    it('creates an activity log entry on approval', async () => {
      const expense = await createAndSubmitExpense();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const logs = await prisma.activityLog.findMany({
        where: {
          module: 'EXPENSES',
          action: 'APPROVE',
          tenantId: testData.tenantA.id,
        },
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. EDIT RESTRICTIONS', () => {
    it('DRAFT allows editing financial fields', async () => {
      const expense = await createExpenseInDb();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '250.00' })
        .expect(200);

      expect(res.body.data.amount).toBe('250');
    });

    it('DRAFT allows editing non-financial fields', async () => {
      const expense = await createExpenseInDb();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(res.body.data.description).toBe('Updated description');
    });

    it('SUBMITTED blocks amount change', async () => {
      const expense = await createAndSubmitExpense();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '250.00' })
        .expect(403);
    });

    it('SUBMITTED blocks taxAmount change', async () => {
      const expense = await createAndSubmitExpense();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ taxAmount: '15.00' })
        .expect(403);
    });

    it('SUBMITTED blocks paymentMethod change', async () => {
      const expense = await createAndSubmitExpense();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ paymentMethod: 'CREDIT_CARD' })
        .expect(403);
    });

    it('SUBMITTED blocks vendorId change', async () => {
      const expense = await createExpenseInDb({ vendorId: null });
      await submit(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ vendorId: testData.tenantAVendor.id })
        .expect(403);
    });

    it('SUBMITTED blocks employeeId change', async () => {
      const expense = await createExpenseInDb();
      await submit(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ employeeId: testData.tenantAEmployeeRecord.id })
        .expect(403);
    });

    it('SUBMITTED blocks glAccountId change', async () => {
      const expense = await createExpenseInDb();
      await submit(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ glAccountId: tenantAAccountIds['5000'] })
        .expect(403);
    });

    it('SUBMITTED allows editing non-financial fields', async () => {
      const expense = await createAndSubmitExpense();
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ description: 'Updated after submission' })
        .expect(200);

      expect(res.body.data.description).toBe('Updated after submission');
    });

    it('POSTED cannot be edited', async () => {
      const expense = await createAndSubmitExpense();
      await approveExpense(expense.id);
      await postExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ description: 'Should fail' })
        .expect(403);
    });

    it('PAID cannot be edited', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPostAndPay(expense.id, '100.00');

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ description: 'Should fail' })
        .expect(403);
    });

    it('CANCELLED allows non-financial field edits', async () => {
      const expense = await createExpenseInDb();
      await cancelExpense(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ description: 'Updated after cancel' })
        .expect(200);

      expect(res.body.data.description).toBe('Updated after cancel');
    });

    it('CANCELLED blocks financial field edits', async () => {
      const expense = await createExpenseInDb();
      await cancelExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '999.00' })
        .expect(403);
    });

    it('REJECTED blocks financial field edits', async () => {
      const expense = await createAndSubmitExpense();
      await rejectExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '999.00' })
        .expect(403);
    });
  });

  describe('8. POSTING creates GL journal entry', () => {
    it('APPROVED → POSTED creates a balanced journal entry (direct-paid: DR 5010 / CR 1000)', async () => {
      const expense = await createExpenseInDb({ amount: '100.00', paymentMethod: 'CASH' });
      await submitAndApprove(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();
      expect(je!.posted).toBe(true);
      expect(je!.tenantId).toBe(testData.tenantA.id);

      const expenseLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const cashLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine!.debitAmount as any)).toBe(100);
      expect(cashLine).toBeTruthy();
      expect(parseFloat(cashLine!.creditAmount as any)).toBe(100);

      const totalDebit = je!.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
      const totalCredit = je!.lines.reduce((s, l) => s + Number(l.creditAmount), 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('vendor expense posts to AP (DR 5010 / CR 2000)', async () => {
      const expense = await prisma.expense.create({
        data: {
          expenseDate: new Date('2024-01-15'),
          category: 'Consulting',
          description: uniqueDescription('vendor-expense'),
          amount: 250,
          paymentMethod: 'BANK_TRANSFER',
          vendorId: testData.tenantAVendor.id,
          tenantId: testData.tenantA.id,
        },
      });

      await submit(expense.id);
      await approveExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const expenseLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const apLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['2000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine!.debitAmount as any)).toBe(250);
      expect(apLine).toBeTruthy();
      expect(parseFloat(apLine!.creditAmount as any)).toBe(250);
    });

    it('includes tax amount in posting when provided', async () => {
      const expense = await createExpenseInDb({
        amount: '100.00',
        taxAmount: '10.00',
        paymentMethod: 'CASH',
      });
      await submitAndApprove(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const expenseLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['5010']);
      const cashLine = je!.lines.find((l) => l.accountId === tenantAAccountIds['1000']);
      expect(expenseLine).toBeTruthy();
      expect(parseFloat(expenseLine!.debitAmount as any)).toBe(110);
      expect(cashLine).toBeTruthy();
      expect(parseFloat(cashLine!.creditAmount as any)).toBe(110);
    });

    it('uses custom glAccountId for expense when provided', async () => {
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
          expenseDate: new Date('2024-01-15'),
          category: 'Travel',
          description: uniqueDescription('custom-gl-expense'),
          amount: 75,
          paymentMethod: 'CARD',
          glAccountId: customAccount.id,
          tenantId: testData.tenantA.id,
        },
      });

      await submit(expense.id);
      await approveExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const je = await prisma.journalEntry.findFirst({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
        include: { lines: true },
      });
      expect(je).toBeTruthy();

      const customLine = je!.lines.find((l) => l.accountId === customAccount.id);
      expect(customLine).toBeTruthy();
      expect(parseFloat(customLine!.debitAmount as any)).toBe(75);
    });
  });

  describe('9. DUPLICATE POST PROTECTION', () => {
    it('rejects posting again after POSTED status', async () => {
      const expense = await createExpenseInDb({ amount: '200.00' });
      await submitAndApprove(expense.id);
      await postExpense(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(400);

      const jeCount = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
      });
      expect(jeCount).toBe(1);
    });

    it('rejects duplicate via post-to-ledger (ConflictException from GL)', async () => {
      const expense = await createExpenseInDb({ amount: '200.00' });
      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/expenses/${expense.id}/post-to-ledger`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(409);

      const jeCount = await prisma.journalEntry.count({
        where: { tenantId: testData.tenantA.id, referenceId: `expense_${expense.id}` },
      });
      expect(jeCount).toBe(1);
    });
  });

  describe('10. PAYMENT', () => {
    it('partial payment increases amountPaid and decreases balance, stays POSTED', async () => {
      const expense = await createExpenseInDb({ amount: '300.00' });
      await submitAndApproveAndPost(expense.id);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '100.00' })
        .expect(200);

      const updated = res.body.data;
      expect(updated.status).toBe(ExpenseStatus.POSTED);
      expect(parseFloat(updated.amountPaid)).toBeCloseTo(100, 5);
      expect(parseFloat(updated.balanceAmount)).toBeCloseTo(200, 5);
      expect(updated.paidAt).toBeNull();
    });

    it('final payment sets status to PAID, balance 0, paidAt populated', async () => {
      const expense = await createExpenseInDb({ amount: '300.00' });
      await submitAndApproveAndPost(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '100.00' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '200.00' })
        .expect(200);

      const updated = res.body.data;
      expect(updated.status).toBe(ExpenseStatus.PAID);
      expect(parseFloat(updated.amountPaid)).toBeCloseTo(300, 5);
      expect(parseFloat(updated.balanceAmount)).toBeCloseTo(0, 5);
      expect(updated.paidAt).toBeTruthy();
    });
  });

  describe('11. OVERPAYMENT', () => {
    it('rejects payment greater than remaining balance', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPost(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '60.00' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '100.00' })
        .expect(400);

      const updated = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(updated!.status).toBe(ExpenseStatus.POSTED);
      expect(parseFloat(updated!.amountPaid as any)).toBeCloseTo(60, 5);
      expect(parseFloat(updated!.balanceAmount as any)).toBeCloseTo(40, 5);
    });

    it('rejects payment on non-POSTED expense', async () => {
      const expense = await createAndSubmitExpense();

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send({ amount: '50.00' })
        .expect(400);
    });
  });

  describe('12. TENANT ISOLATION', () => {
    it('tenant B cannot view tenant A expense', async () => {
      const expense = await createExpenseInDb();

      await request(app.getHttpServer())
        .get(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(403);
    });

    it('tenant B cannot update tenant A expense', async () => {
      const expense = await createExpenseInDb();

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .send({ description: 'Hacked' })
        .expect(403);
    });

    it('tenant B cannot submit tenant A expense', async () => {
      const expense = await createExpenseInDb();

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/submit`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(403);
    });

    it('tenant B cannot approve tenant A expense', async () => {
      const expense = await createAndSubmitExpense();

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/approve`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(403);
    });

    it('tenant B cannot post tenant A expense', async () => {
      const expense = await createAndSubmitExpense();
      await approveExpense(expense.id);

      const statusBefore = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(statusBefore!.status).toBe(ExpenseStatus.APPROVED);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/post`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(403);

      const statusAfter = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(statusAfter!.status).toBe(ExpenseStatus.APPROVED);
    });

    it('tenant B cannot make payment on tenant A expense', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPost(expense.id);

      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/payment`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .send({ amount: '100.00' })
        .expect(403);
    });

    it('tenant B cannot delete tenant A expense', async () => {
      const expense = await createExpenseInDb();

      await request(app.getHttpServer())
        .delete(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(403);

      const exists = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(exists).toBeTruthy();
    });

    it('tenant B cannot access non-existent expense (404, not 403 leak)', async () => {
      await request(app.getHttpServer())
        .get(`/expenses/nonexistent-expense-id`)
        .set('Authorization', `Bearer ${adminTokenB()}`)
        .expect(404);
    });
  });

  describe('13. ACTIVITY LOG', () => {
    it('CREATE generates an activity log entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .send(createDraftExpense({ description: uniqueDescription('log-create') }))
        .expect(201);

      const expense = res.body.data;
      const logs = await prisma.activityLog.findMany({
        where: {
          module: 'EXPENSES',
          action: 'CREATE',
          tenantId: testData.tenantA.id,
        },
      });
      expect(logs.length).toBe(1);
    });

    it('SUBMIT generates an activity log entry', async () => {
      const expense = await createExpenseInDb();
      await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}/submit`)
        .set('Authorization', `Bearer ${adminTokenA()}`)
        .expect(200);

      const logs = await prisma.activityLog.findMany({
        where: { module: 'EXPENSES', action: 'SUBMIT', tenantId: testData.tenantA.id },
      });
      expect(logs.length).toBe(1);
    });

    it('CANCEL generates an activity log entry', async () => {
      const expense = await createExpenseInDb();
      await cancelExpense(expense.id);

      const logs = await prisma.activityLog.findMany({
        where: { module: 'EXPENSES', action: 'CANCEL', tenantId: testData.tenantA.id },
      });
      expect(logs.length).toBe(1);
    });

    it('PAYMENT generates an activity log entry', async () => {
      const expense = await createExpenseInDb({ amount: '100.00' });
      await submitAndApproveAndPostAndPay(expense.id, '100.00');

      const logs = await prisma.activityLog.findMany({
        where: { module: 'EXPENSES', action: 'PAYMENT', tenantId: testData.tenantA.id },
      });
      expect(logs.length).toBe(1);
    });
  });

  // Helper functions

  async function createExpenseInDb(overrides: any = {}) {
    return prisma.expense.create({
      data: {
        expenseDate: new Date(overrides.expenseDate || '2024-01-15'),
        category: overrides.category || 'Office Supplies',
        description: overrides.description || uniqueDescription('db-expense'),
        amount: overrides.amount || 100,
        taxAmount: overrides.taxAmount || 0,
        paymentMethod: overrides.paymentMethod || 'CASH',
        vendorId: overrides.vendorId || undefined,
        glAccountId: overrides.glAccountId || undefined,
        tenantId: testData.tenantA.id,
      },
    });
  }

  async function createAndSubmitExpense() {
    const expense = await createExpenseInDb();
    await request(app.getHttpServer())
      .patch(`/expenses/${expense.id}/submit`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
    return expense;
  }

  async function submit(id: string) {
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/submit`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
  }

  async function approveExpense(id: string) {
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/approve`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
  }

  async function rejectExpense(id: string) {
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/reject`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
  }

  async function cancelExpense(id: string) {
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/cancel`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
  }

  async function postExpense(id: string) {
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/post`)
      .set('Authorization', `Bearer ${adminTokenA()}`)
      .expect(200);
  }

  async function submitAndApprove(id: string) {
    await submit(id);
    await approveExpense(id);
  }

  async function submitAndApproveAndPost(id: string) {
    await submitAndApprove(id);
    await postExpense(id);
  }

  async function submitAndApproveAndPostAndPay(id: string, amount: string) {
    await submitAndApproveAndPost(id);
    await request(app.getHttpServer())
      .patch(`/expenses/${id}/payment`)
    .set('Authorization', `Bearer ${adminTokenA()}`)
    .send({ amount })
    .expect(200);
  }

  describe('Expenses Authorization E2E', () => {
    describe('1. EMPLOYEE allowed operations', () => {
      it('EMPLOYEE can create an expense', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send(
            createDraftExpense({
              description: uniqueDescription('employee-create'),
              createdById: 'spoofed-id',
            }),
          )
          .expect(201);

        const expense = res.body.data;
        expect(expense.status).toBe(ExpenseStatus.DRAFT);
        expect(expense.createdById).toBe(testData.tenantAEmployee.id);
      });

      it('EMPLOYEE can view expenses in their tenant', async () => {
        await createExpenseInDb();

        const res = await request(app.getHttpServer())
          .get('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(200);

        const expenses = res.body.data.data;
        expect(Array.isArray(expenses)).toBe(true);
        expenses.forEach((e: any) => {
          expect(e.tenantId).toBe(testData.tenantA.id);
        });
      });

      it('EMPLOYEE can view own expense by id', async () => {
        const expense = await createExpenseInDb();

        const res = await request(app.getHttpServer())
          .get(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(200);

        expect(res.body.data.id).toBe(expense.id);
      });

      it('EMPLOYEE can edit their own DRAFT expense', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('employee-edit') }))
          .expect(201);

        const expense = res.body.data;
        const updated = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send({ description: 'Updated by creator' })
          .expect(200);

        expect(updated.body.data.description).toBe('Updated by creator');
      });

      it('EMPLOYEE can submit their own DRAFT expense', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('employee-submit') }))
          .expect(201);

        const submitRes = await request(app.getHttpServer())
          .patch(`/expenses/${res.body.data.id}/submit`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(200);

        expect(submitRes.body.data.status).toBe(ExpenseStatus.SUBMITTED);
      });

      it('EMPLOYEE cannot edit another user expense', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('admin-create') }))
          .expect(201);

        const expense = res.body.data;
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send({ description: 'Hacked by employee' })
          .expect(403);
      });
    });

    describe('2. EMPLOYEE cannot approve/post/pay', () => {
      it('EMPLOYEE cannot approve (403)', async () => {
        const expense = await createAndSubmitExpense();
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });

      it('EMPLOYEE cannot post (403)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });

      it('EMPLOYEE cannot record payment (403)', async () => {
        const expense = await createExpenseInDb({ amount: '100.00' });
        await submitAndApproveAndPost(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send({ amount: '50.00' })
          .expect(403);
      });

      it('EMPLOYEE cannot reject (403)', async () => {
        const expense = await createAndSubmitExpense();
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/reject`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });

      it('EMPLOYEE cannot cancel (403)', async () => {
        const expense = await createAndSubmitExpense();
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/cancel`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });

      it('EMPLOYEE cannot delete (403)', async () => {
        const expense = await createExpenseInDb();
        await request(app.getHttpServer())
          .delete(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });

      it('EMPLOYEE cannot post-to-ledger (403)', async () => {
        const expense = await createExpenseInDb();
        await request(app.getHttpServer())
          .post(`/expenses/${expense.id}/post-to-ledger`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(403);
      });
    });

    describe('3. MANAGER approval/rejection permissions', () => {
      it('MANAGER can approve submitted expense', async () => {
        const expense = await createAndSubmitExpense();
        const res = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(200);

        expect(res.body.data.status).toBe(ExpenseStatus.APPROVED);
      });

      it('MANAGER can reject submitted expense', async () => {
        const expense = await createAndSubmitExpense();
        const res = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/reject`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(200);

        expect(res.body.data.status).toBe(ExpenseStatus.REJECTED);
      });

      it('MANAGER cannot post (403)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);
      });

      it('MANAGER cannot record payment (403)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);
        await postExpense(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .send({ amount: '50.00' })
          .expect(403);
      });

      it('MANAGER cannot post-to-ledger (403)', async () => {
        const expense = await createExpenseInDb();
        await request(app.getHttpServer())
          .post(`/expenses/${expense.id}/post-to-ledger`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);
      });

      it('MANAGER cannot delete (403)', async () => {
        const expense = await createAndSubmitExpense();
        await request(app.getHttpServer())
          .delete(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);
      });

      it('MANAGER can cancel a submitted expense', async () => {
        const expense = await createAndSubmitExpense();
        const res = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/cancel`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(200);

        expect(res.body.data.status).toBe(ExpenseStatus.CANCELLED);
      });
    });

    describe('4. ADMIN / SUPER_ADMIN full access', () => {
      it('ADMIN can perform full workflow: create → submit → post → pay (SUPER_ADMIN approves)', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('admin-full'), amount: '200.00' }))
          .expect(201);

        const expense = res.body.data;

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${superAdminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(200);

        const payRes = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send({ amount: '200.00' })
          .expect(200);

        expect(payRes.body.data.status).toBe(ExpenseStatus.PAID);
      });

      it('SUPER_ADMIN can perform full workflow: approve → post → pay', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('sa-full'), amount: '150.00' }))
          .expect(201);

        const expense = res.body.data;
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${superAdminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${superAdminTokenA()}`)
          .expect(200);

        const payRes = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${superAdminTokenA()}`)
          .send({ amount: '150.00' })
          .expect(200);

        expect(payRes.body.data.status).toBe(ExpenseStatus.PAID);
      });
    });

    describe('5. Unauthenticated requests rejected', () => {
      it('no token → GET /expenses (401)', async () => {
        await request(app.getHttpServer()).get('/expenses').expect(401);
      });

      it('no token → POST /expenses (401)', async () => {
        await request(app.getHttpServer())
          .post('/expenses')
          .send(createDraftExpense())
          .expect(401);
      });

      it('no token → PATCH /expenses/:id/submit (401)', async () => {
        await request(app.getHttpServer())
          .patch('/expenses/some-id/submit')
          .expect(401);
      });

      it('no token → PATCH /expenses/:id/approve (401)', async () => {
        await request(app.getHttpServer())
          .patch('/expenses/some-id/approve')
          .expect(401);
      });

      it('no token → PATCH /expenses/:id/post (401)', async () => {
        await request(app.getHttpServer())
          .patch('/expenses/some-id/post')
          .expect(401);
      });

      it('no token → PATCH /expenses/:id/payment (401)', async () => {
        await request(app.getHttpServer())
          .patch('/expenses/some-id/payment')
          .send({ amount: '50.00' })
          .expect(401);
      });

      it('no token → DELETE /expenses/:id (401)', async () => {
        await request(app.getHttpServer())
          .delete('/expenses/some-id')
          .expect(401);
      });
    });

    describe('6. Cross-tenant access rejected', () => {
      it('tenant B cannot view tenant A expense (403)', async () => {
        const expense = await createExpenseInDb();

        await request(app.getHttpServer())
          .get(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .expect(403);
      });

      it('tenant B cannot submit tenant A expense (403)', async () => {
        const expense = await createExpenseInDb();

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .expect(403);
      });

      it('tenant B cannot approve tenant A expense (403)', async () => {
        const expense = await createAndSubmitExpense();

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .expect(403);
      });

      it('tenant B cannot post tenant A expense (403)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);

        const before = await prisma.expense.findUnique({ where: { id: expense.id } });
        expect(before!.status).toBe(ExpenseStatus.APPROVED);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .expect(403);

        const after = await prisma.expense.findUnique({ where: { id: expense.id } });
        expect(after!.status).toBe(ExpenseStatus.APPROVED);
      });

      it('tenant B cannot pay on tenant A expense (403)', async () => {
        const expense = await createExpenseInDb({ amount: '100.00' });
        await submitAndApproveAndPost(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .send({ amount: '50.00' })
          .expect(403);
      });

      it('tenant B expense list only returns tenant B expenses', async () => {
        const tenantAExpense = await createExpenseInDb();

        const res = await request(app.getHttpServer())
          .get('/expenses')
          .set('Authorization', `Bearer ${adminTokenB()}`)
          .expect(200);

        const expenses = res.body.data.data;
        expenses.forEach((e: any) => {
          expect(e.tenantId).toBe(testData.tenantB.id);
        });
        expect(expenses.find((e: any) => e.id === tenantAExpense.id)).toBeUndefined();
      });
    });

    describe('7. User identity from JWT, not request body', () => {
      it('createdById comes from authenticated user, not body', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send(
            createDraftExpense({
              description: uniqueDescription('spoof-test'),
              createdById: 'spoofed-injected-id',
            }),
          )
          .expect(201);

        const expense = res.body.data;
        expect(expense.createdById).toBe(testData.tenantAEmployee.id);
        expect(expense.createdById).not.toBe('spoofed-injected-id');
      });

      it('approver identity comes from JWT, not body', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('approver-spoof') }))
          .expect(201);

        const expense = res.body.data;
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${employeeTokenA()}`)
          .expect(200);

        const approveRes = await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send({ approvedById: 'spoofed-approver-id' })
          .expect(200);

        expect(approveRes.body.data.approvedById).toBe(testData.tenantAAdmin.id);
      });
    });

    describe('8. Workflow endpoints cannot bypass authorization', () => {
      it('MANAGER cannot post (403, role guard blocks before service)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);

        const statusBefore = await prisma.expense.findUnique({ where: { id: expense.id } });
        expect(statusBefore!.status).toBe(ExpenseStatus.APPROVED);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/post`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);

        const statusAfter = await prisma.expense.findUnique({ where: { id: expense.id } });
        expect(statusAfter!.status).toBe(ExpenseStatus.APPROVED);
      });

      it('MANAGER cannot access payment endpoint (403)', async () => {
        const expense = await createAndSubmitExpense();
        await approveExpense(expense.id);
        await postExpense(expense.id);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/payment`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .send({ amount: '10.00' })
          .expect(403);
      });

      it('MANAGER cannot access post-to-ledger (403)', async () => {
        const expense = await createExpenseInDb();
        await request(app.getHttpServer())
          .post(`/expenses/${expense.id}/post-to-ledger`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);
      });

      it('MANAGER cannot delete expense (403)', async () => {
        const expense = await createExpenseInDb();
        await request(app.getHttpServer())
          .delete(`/expenses/${expense.id}`)
          .set('Authorization', `Bearer ${managerTokenA()}`)
          .expect(403);

        const exists = await prisma.expense.findUnique({ where: { id: expense.id } });
        expect(exists).toBeTruthy();
      });
    });

    describe('Separation of duty', () => {
      it('user cannot approve their own submitted expense (403)', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('self-approve') }))
          .expect(201);

        const expense = res.body.data;
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/approve`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(403);
      });

      it('user cannot reject their own submitted expense (403)', async () => {
        const res = await request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .send(createDraftExpense({ description: uniqueDescription('self-reject') }))
          .expect(201);

        const expense = res.body.data;
        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/submit`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/expenses/${expense.id}/reject`)
          .set('Authorization', `Bearer ${adminTokenA()}`)
          .expect(403);
      });
    });
  });
});
