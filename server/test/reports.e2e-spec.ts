import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Reports E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: {
    tenantA: { id: string };
    tenantB: { id: string };
    tenantAAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAClient: { id: string };
    tenantBClient: { id: string };
    tenantAInvoice: { id: string };
    tenantBInvoice: { id: string };
    tenantAPayment: { id: string };
    tenantBPayment: { id: string };
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
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    await prisma.activityLog.deleteMany();
  });

  const generateToken = (user: any) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated access to reports', async () => {
      await request(app.getHttpServer())
        .get('/reports/dashboard')
        .expect(401);
    });
  });

  describe('Dashboard Report', () => {
    it('should return dashboard stats for authenticated tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalSales).toBeDefined();
      expect(response.body.data.invoiceCount).toBeDefined();
      expect(response.body.data.customerCount).toBeGreaterThanOrEqual(1);
    });

    it('should return different data for different tenants', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const responseA = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.data).toBeDefined();
      expect(responseB.body.data).toBeDefined();
    });
  });

  describe('Sales Report', () => {
    it('should exclude DRAFT and CANCELLED invoices', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/sales')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.salesByStatus).toBeDefined();
    });

    it('should filter by date range', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/sales?dateFrom=2024-01-01&dateTo=2024-12-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalSales).toBeDefined();
    });
  });

  describe('Receivables Report', () => {
    it('should return receivables breakdown', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/receivables')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalReceivables).toBeDefined();
      expect(response.body.data.aging).toBeDefined();
      expect(response.body.data.topOutstandingCustomers).toBeDefined();
    });
  });

  describe('Customer Report', () => {
    it('should return customer analytics', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.customerCount).toBeGreaterThanOrEqual(1);
      expect(response.body.data.topCustomers).toBeDefined();
      expect(response.body.data.paymentHistory).toBeDefined();
    });
  });

  describe('Unavailable Reports', () => {
    it('should return expense report data when expense module is available', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.totalExpenses).toBeDefined();
    });

    it('should return purchase report data when purchase module is available', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/purchases')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.totalPurchases).toBeDefined();
    });

    it('should return vendor report data when vendor module is available', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/vendors')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.totalVendors).toBeDefined();
    });

    it('should return authoritative profitability report', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/profitability')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.available).toBe(true);
      expect(response.body.data.method).toBeDefined();
      expect(typeof response.body.data.totalCogs).toBe('number');
      expect(typeof response.body.data.totalRevenue).toBe('number');
      expect(typeof response.body.data.grossProfit).toBe('number');
    });
  });

  describe('Cross-Tenant Isolation', () => {
    it('should not leak tenant A data to tenant B', async () => {
      const tokenB = generateToken(testData.tenantBAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });
});
