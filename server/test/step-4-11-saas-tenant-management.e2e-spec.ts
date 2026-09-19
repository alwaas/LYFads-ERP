import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Step 4.11 - SaaS Tenant Management Foundation (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    testData = await setupTestDatabase();
  }, 120000);

  beforeEach(async () => {
    await prisma.tenant.update({
      where: { id: testData.tenantA.id },
      data: { status: 'ACTIVE' },
    });
    await prisma.tenantSubscription.update({
      where: { tenantId: testData.tenantA.id },
      data: { status: 'ACTIVE' },
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  const generateToken = (user: any) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('AUTHORIZATION', () => {
    it('should allow SUPER_ADMIN to list tenants', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should reject EMPLOYEE from listing tenants', async () => {
      const token = generateToken(testData.tenantAEmployee);
      await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject MANAGER from listing tenants', async () => {
      const token = generateToken(testData.tenantAManager);
      await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject ADMIN from listing tenants', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject unauthenticated access to tenants', async () => {
      await request(app.getHttpServer()).get('/tenants').expect(401);
    });
  });

  describe('TENANT LIFECYCLE', () => {
    it('should allow SUPER_ADMIN to create tenant', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Test Tenant',
          slug: 'new-test-tenant',
          email: 'new@tenant.com',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('New Test Tenant');
      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should reject duplicate tenant slug', async () => {
      const token = generateToken(testData.superAdmin);
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate Slug',
          slug: 'test-tenant-a',
        })
        .expect(409);
    });

    it('should allow SUPER_ADMIN to suspend tenant', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post(`/tenants/${testData.tenantA.id}/suspend`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('SUSPENDED');
    });

    it('should allow SUPER_ADMIN to activate tenant', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post(`/tenants/${testData.tenantA.id}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should allow SUPER_ADMIN to deactivate tenant', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post(`/tenants/${testData.tenantA.id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('INACTIVE');
    });

    it('should allow SUPER_ADMIN to view tenant details', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .get(`/tenants/${testData.tenantA.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testData.tenantA.id);
      expect(response.body.data.name).toBe('Test Tenant A');
    });
  });

  describe('TENANT SELF-SERVICE', () => {
    it('should allow ADMIN to view current tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants/current')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testData.tenantA.id);
    });

    it('should allow ADMIN to update current tenant profile', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .patch('/tenants/current')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '+1 999 999 9999',
        })
        .expect(200);

      expect(response.body.data.phone).toBe('+1 999 999 9999');
    });
  });

  describe('TENANT ISOLATION', () => {
    it('should prevent Tenant A admin from accessing Tenant B subscription', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .get(`/tenants/${testData.tenantB.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should prevent Tenant A admin from accessing Tenant B usage', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .get(`/tenants/${testData.tenantB.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PLAN MANAGEMENT', () => {
    it('should allow SUPER_ADMIN to create plan', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Enterprise',
          code: 'ENTERPRISE',
          description: 'Enterprise plan',
          price: 99.99,
          billingInterval: 'MONTHLY',
          features: [
            { featureCode: 'ALL', description: 'All features' },
          ],
          limits: [
            { resourceCode: 'MAX_USERS', limitValue: -1 },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Enterprise');
      expect(response.body.data.code).toBe('ENTERPRISE');
    });

    it('should reject duplicate plan code', async () => {
      const token = generateToken(testData.superAdmin);
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate',
          code: 'PRO',
        })
        .expect(409);
    });

    it('should allow SUPER_ADMIN to list plans', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject non-SUPER_ADMIN from creating plan', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized',
          code: 'UNAUTH',
        })
        .expect(403);
    });

    it('should allow SUPER_ADMIN to update plan', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .patch(`/plans/${testData.defaultPlan.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          price: 49.99,
        })
        .expect(200);

      expect(response.body.data.price).toBeDefined();
    });
  });

  describe('SUBSCRIPTION MANAGEMENT', () => {
    it('should allow SUPER_ADMIN to view tenant subscription', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .get(`/tenants/${testData.tenantA.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.planId).toBe(testData.defaultPlan.id);
    });

    it('should allow ADMIN to view current subscription', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/subscriptions/current')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should prevent duplicate subscription assignment', async () => {
      const token = generateToken(testData.superAdmin);
      await request(app.getHttpServer())
        .post(`/tenants/${testData.tenantA.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: testData.defaultPlan.id,
        })
        .expect(409);
    });

    it('should allow SUPER_ADMIN to update subscription', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .patch(`/tenants/${testData.tenantA.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should allow SUPER_ADMIN to cancel subscription', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post(`/tenants/${testData.tenantA.id}/subscription/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('USAGE & ENTITLEMENTS', () => {
    it('should allow ADMIN to view current usage', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants/current/usage')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.usage).toBeInstanceOf(Array);
    });

    it('should allow ADMIN to view current limits', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants/current/limits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should allow ADMIN to view current entitlements', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants/current/entitlements')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('hasSubscription');
    });

    it('should scope usage to current tenant only', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .get('/tenants/current/usage')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const usersUsage = response.body.data.usage.find(
        (u: any) => u.resource === 'users',
      );
      expect(usersUsage).toBeDefined();
      expect(usersUsage.used).toBeGreaterThanOrEqual(3);
    });
  });

  describe('AUDIT LOGGING', () => {
    it('should create audit log when tenant is created', async () => {
      const token = generateToken(testData.superAdmin);
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Audit Test Tenant',
          slug: 'audit-test-tenant',
        })
        .expect(201);

      const logs = await prisma.activityLog.findMany({
        where: {
          action: 'CREATE',
          module: 'TENANT',
          tenantId: response.body.data.id,
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should create audit log when plan is created', async () => {
      const token = generateToken(testData.superAdmin);
      const beforeCount = await prisma.activityLog.count({
        where: { module: 'PLAN' },
      });

      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Audit Plan',
          code: 'AUDIT_PLAN',
        })
        .expect(201);

      const afterCount = await prisma.activityLog.count({
        where: { module: 'PLAN' },
      });

      expect(afterCount).toBeGreaterThan(beforeCount);
    });
  });
});
