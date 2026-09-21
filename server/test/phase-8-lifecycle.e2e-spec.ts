import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';

describe('Phase 8 Automated Lifecycle Tasks (Overdue Invoices & Expired Subscriptions)', () => {
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

  const superAdminToken = () =>
    jwtService.sign({
      sub: testData.superAdmin.id,
      email: testData.superAdmin.email,
      role: testData.superAdmin.role,
      fullName: testData.superAdmin.fullName,
    });

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

  describe('1. Overdue Invoice Lifecycle Processing', () => {
    let pastDueInvoiceId: string;
    let futureInvoiceId: string;
    let draftPastDueInvoiceId: string;

    beforeAll(async () => {
      // 1. Past due invoice (due 5 days ago, status SENT, balance > 0)
      const pastDue = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-OVERDUE-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          tenantId: testData.tenantA.id,
          issueDate: new Date(Date.now() - 35 * 86400000),
          dueDate: new Date(Date.now() - 5 * 86400000),
          subtotal: 500.0,
          total: 500.0,
          balanceAmount: 500.0,
          paidAmount: 0.0,
          status: InvoiceStatus.SENT,
        },
      });
      pastDueInvoiceId = pastDue.id;

      // 2. Future invoice (due in 10 days, status SENT)
      const future = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-FUTURE-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          tenantId: testData.tenantA.id,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 10 * 86400000),
          subtotal: 300.0,
          total: 300.0,
          balanceAmount: 300.0,
          paidAmount: 0.0,
          status: InvoiceStatus.SENT,
        },
      });
      futureInvoiceId = future.id;

      // 3. Draft invoice with past due date (should remain DRAFT)
      const draft = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-DRAFT-PAST-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          tenantId: testData.tenantA.id,
          issueDate: new Date(Date.now() - 30 * 86400000),
          dueDate: new Date(Date.now() - 2 * 86400000),
          subtotal: 250.0,
          total: 250.0,
          balanceAmount: 250.0,
          paidAmount: 0.0,
          status: InvoiceStatus.DRAFT,
        },
      });
      draftPastDueInvoiceId = draft.id;
    });

    it('Transitions past due SENT invoices to OVERDUE while preserving future and DRAFT invoices', async () => {
      const res = await request(app.getHttpServer())
        .post('/lifecycle/invoices/overdue')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .expect(201);

      const result = unwrap(res);
      expect(result.processedCount).toBeGreaterThanOrEqual(1);
      expect(result.updatedIds).toContain(pastDueInvoiceId);

      const updatedPastDue = await prisma.invoice.findUnique({
        where: { id: pastDueInvoiceId },
      });
      expect(updatedPastDue?.status).toBe(InvoiceStatus.OVERDUE);

      const updatedFuture = await prisma.invoice.findUnique({
        where: { id: futureInvoiceId },
      });
      expect(updatedFuture?.status).toBe(InvoiceStatus.SENT);

      const updatedDraft = await prisma.invoice.findUnique({
        where: { id: draftPastDueInvoiceId },
      });
      expect(updatedDraft?.status).toBe(InvoiceStatus.DRAFT);
    });

    it('Is idempotent when executed repeatedly', async () => {
      const res = await request(app.getHttpServer())
        .post('/lifecycle/invoices/overdue')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .expect(201);

      const result = unwrap(res);
      expect(result.updatedIds).not.toContain(pastDueInvoiceId);
    });
  });

  describe('2. Subscription & Trial Expiration Lifecycle Processing', () => {
    beforeAll(async () => {
      // Set Tenant A subscription to expired trial
      await prisma.tenantSubscription.update({
        where: { tenantId: testData.tenantA.id },
        data: {
          status: SubscriptionStatus.TRIAL,
          trialEndDate: new Date(Date.now() - 2 * 86400000),
        },
      });

      // Set Tenant B subscription to active trial
      await prisma.tenantSubscription.update({
        where: { tenantId: testData.tenantB.id },
        data: {
          status: SubscriptionStatus.TRIAL,
          trialEndDate: new Date(Date.now() + 14 * 86400000),
        },
      });
    });

    it('Transitions expired trial to EXPIRED while preserving valid trials', async () => {
      const res = await request(app.getHttpServer())
        .post('/lifecycle/subscriptions/expired')
        .set('Authorization', `Bearer ${superAdminToken()}`)
        .expect(201);

      const result = unwrap(res);
      expect(result.processedCount).toBeGreaterThanOrEqual(1);

      const subA = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });
      expect(subA?.status).toBe(SubscriptionStatus.EXPIRED);

      const subB = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantB.id },
      });
      expect(subB?.status).toBe(SubscriptionStatus.TRIAL);
    });

    it('Authoritatively locks out expired tenant at request time', async () => {
      // Tenant A is now expired, should be rejected by TenantStatusGuard
      await request(app.getHttpServer())
        .get('/invoices')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .expect(403);
    });
  });

  describe('3. Combined Lifecycle Run Endpoint', () => {
    it('Runs combined lifecycle task and returns comprehensive summary', async () => {
      const res = await request(app.getHttpServer())
        .post('/lifecycle/run')
        .set('Authorization', `Bearer ${superAdminToken()}`)
        .expect(201);

      const result = unwrap(res);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('overdueInvoices');
      expect(result).toHaveProperty('expiredSubscriptions');
      expect(typeof result.overdueInvoices.processedCount).toBe('number');
      expect(typeof result.expiredSubscriptions.processedCount).toBe('number');
    });
  });
});
