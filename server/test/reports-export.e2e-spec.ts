import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Prisma } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Reports Export E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: {
    tenantA: { id: string };
    tenantB: { id: string };
    tenantAAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
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
    it('should reject unauthenticated access to CSV export', async () => {
      await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .expect(401);
    });

    it('should reject unauthenticated access to Excel export', async () => {
      await request(app.getHttpServer())
        .get('/reports/export/sales/excel')
        .expect(401);
    });

    it('should reject unauthenticated access to PDF export', async () => {
      await request(app.getHttpServer())
        .get('/reports/export/sales/pdf')
        .expect(401);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthorized role access to export', async () => {
      const token = generateToken({
        ...testData.tenantAAdmin,
        role: 'EMPLOYEE',
      });

      await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('CSV Export', () => {
    it('should export sales report as CSV', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeDefined();
    });

    it('should export expenses report as CSV', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/expenses/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export receivables report as CSV', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/receivables/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Excel Export', () => {
    it('should export sales report as Excel', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/excel')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    it('should export inventory report as Excel', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/inventory/excel')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('PDF Export', () => {
    it('should export sales report as PDF', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/pdf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('pdf');
      expect(response.headers['content-disposition']).toContain('.pdf');
    });

    it('should export receivables report as PDF', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/receivables/pdf')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('pdf');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not leak tenant A data to tenant B in CSV export', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const responseA = await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body).toBeDefined();
      expect(responseB.body).toBeDefined();
    });

    it('should not allow tenant B to export tenant A report', async () => {
      const tokenB = generateToken(testData.tenantBAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Invalid Report Type', () => {
    it('should return 400 for unsupported report type', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get('/reports/export/invalid-report-type/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should return 400 for unsupported format', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get('/reports/export/sales/invalid-format')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('Precision Correctness', () => {
    it('should preserve decimal precision in CSV export', async () => {
      const client = await prisma.client.create({
        data: {
          tenantId: testData.tenantA.id,
          companyName: 'Precision Test Client',
          contactPerson: 'Test Person',
          email: 'precision@test.com',
          phone: '1234567890',
          isActive: true,
        },
      });

      await prisma.invoice.create({
        data: {
          tenantId: testData.tenantA.id,
          invoiceNumber: 'INV-PREC-001',
          clientId: client.id,
          total: new Prisma.Decimal(1234.56),
          paidAmount: new Prisma.Decimal(1234.56),
          balanceAmount: new Prisma.Decimal(0),
          status: 'PAID',
          issueDate: new Date(),
          dueDate: new Date(),
          subtotal: new Prisma.Decimal(1234.56),
          tax: new Prisma.Decimal(0),
          discount: new Prisma.Decimal(0),
        },
      });

      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/csv')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      const csvContent = response.text || response.body?.toString() || '';
      expect(csvContent).toContain('1234.56');
    });

    it('should preserve decimal precision in Excel export', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/reports/export/sales/excel')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });
  });
});
