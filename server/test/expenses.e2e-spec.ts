import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Expenses Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminId: string;
  let adminToken: string;
  let testTenantId: string;

  const testEmail = `admin-e2e-${Date.now()}@test.local`;

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

    const testTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Expense Tenant',
        slug: `e2e-expense-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const admin = await prisma.user.create({
      data: {
        email: testEmail,
        password: passwordHash,
        fullName: 'E2E Admin',
        role: UserRole.ADMIN,
        tenant: {
          connect: { id: testTenant.id },
        },
      },
    });

    adminId = admin.id;

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId,
      fullName: admin.fullName,
    });
  });

  afterAll(async () => {
    try {
      if (adminId) {
        await prisma.user.delete({
          where: { id: adminId },
        });
      }
    } catch (error) {
      // cleanup best-effort
    }

    try {
      if (testTenantId) {
        await prisma.tenant.delete({
          where: { id: testTenantId },
        });
      }
    } catch (error) {
      // cleanup best-effort
    }

    await app.close();
  });

  describe('POST /expenses', () => {
    it('should create an expense', async () => {
      const response = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Office Supplies',
          amount: '150.00',
          expenseDate: '2024-01-15',
          category: 'OFFICE_SUPPLIES',
          paymentMethod: 'CARD',
          vendor: 'Office Depot',
          notes: 'Printer paper and ink',
        })
        .expect(201);

      expect(response.body.data.description).toBe('Office Supplies');
      expect(response.body.data.amount).toBe('150');
      expect(response.body.data.category).toBe('OFFICE_SUPPLIES');
      expect(response.body.data.vendor).toBe('Office Depot');

      await prisma.expense.delete({
        where: { id: response.body.data.id },
      });
    });
  });

  describe('GET /expenses', () => {
    it('should list expenses', async () => {
      const response = await request(app.getHttpServer())
        .get('/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /expenses/:id', () => {
    it('should return expense details', async () => {
      const expense = await prisma.expense.create({
        data: {
          description: 'Test Expense',
          amount: 500,
          expenseDate: new Date('2024-01-20'),
          category: 'TRAVEL',
          paymentMethod: 'CASH',
          vendor: 'Uber',
          tenantId: testTenantId,
          userId: adminId,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(expense.id);
      expect(response.body.data.description).toBe('Test Expense');

      await prisma.expense.delete({
        where: { id: expense.id },
      });
    });
  });

  describe('PATCH /expenses/:id', () => {
    it('should update an expense', async () => {
      const expense = await prisma.expense.create({
        data: {
          description: 'Original Expense',
          amount: 1000,
          expenseDate: new Date('2024-01-20'),
          category: 'OTHER',
          paymentMethod: 'CASH',
          vendor: 'Vendor A',
          tenantId: testTenantId,
          userId: adminId,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated Expense',
          amount: '2000.00',
          status: 'APPROVED',
        })
        .expect(200);

      expect(response.body.data.description).toBe('Updated Expense');
      expect(response.body.data.amount).toBe('2000');
      expect(response.body.data.status).toBe('APPROVED');

      await prisma.expense.delete({
        where: { id: expense.id },
      });
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should delete an expense', async () => {
      const expense = await prisma.expense.create({
        data: {
          description: 'To Delete',
          amount: 100,
          expenseDate: new Date('2024-01-20'),
          category: 'OTHER',
          paymentMethod: 'CASH',
          vendor: 'Vendor B',
          tenantId: testTenantId,
          userId: adminId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleted = await prisma.expense.findUnique({
        where: { id: expense.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated expense requests', async () => {
      await request(app.getHttpServer())
        .get('/expenses')
        .expect(401);
    });
  });
});
