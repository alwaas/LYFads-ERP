import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { EntitlementService } from '../src/modules/subscriptions/entitlement.service';

describe('Phase 3 SaaS Entitlement & Limit Enforcement E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let entitlementService: EntitlementService;
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
    entitlementService = app.get<EntitlementService>(EntitlementService);

    testData = await setupTestDatabase();
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

  describe('1. User Creation Plan Limit Enforcement (MAX_USERS)', () => {
    it('blocks user creation with 403 Forbidden when MAX_USERS limit is reached', async () => {
      // Find current user count for tenantA
      const currentUsers = await prisma.user.count({
        where: { tenantId: testData.tenantA.id },
      });

      // Update plan limit for MAX_USERS to exactly currentUsers
      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_USERS',
          },
        },
        update: { limitValue: currentUsers },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_USERS',
          limitValue: currentUsers,
        },
      });

      // Attempt to create another user -> should fail with 403
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          fullName: 'Over Limit User',
          email: `overlimit-${Date.now()}@tenanta.com`,
          password: 'Password123!',
          role: 'EMPLOYEE',
        })
        .expect(403);

      expect(res.body.message).toContain('Plan limit reached for MAX_USERS');

      // Now raise limit by 1
      await prisma.planLimit.update({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_USERS',
          },
        },
        data: { limitValue: currentUsers + 1 },
      });

      // Creation should now succeed with 201
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          fullName: 'Allowed User',
          email: `allowed-${Date.now()}@tenanta.com`,
          password: 'Password123!',
          role: 'EMPLOYEE',
        })
        .expect(201);
    });
  });

  describe('2. Project Creation Plan Limit Enforcement (MAX_PROJECTS)', () => {
    it('blocks project creation with 403 Forbidden when MAX_PROJECTS limit is reached', async () => {
      const currentProjects = await prisma.project.count({
        where: { tenantId: testData.tenantA.id },
      });

      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_PROJECTS',
          },
        },
        update: { limitValue: currentProjects },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_PROJECTS',
          limitValue: currentProjects,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'Over Limit Project',
          projectCode: `PRJ-LMT-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'ACTIVE',
          priority: 'MEDIUM',
        })
        .expect(403);

      expect(res.body.message).toContain('Plan limit reached for MAX_PROJECTS');
    });
  });

  describe('3. Product Creation Plan Limit Enforcement (MAX_PRODUCTS)', () => {
    it('blocks product creation with 403 Forbidden when MAX_PRODUCTS limit is reached', async () => {
      const currentProducts = await prisma.product.count({
        where: { tenantId: testData.tenantA.id },
      });

      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_PRODUCTS',
          },
        },
        update: { limitValue: currentProducts },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_PRODUCTS',
          limitValue: currentProducts,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          sku: `SKU-LMT-${Date.now()}`,
          name: 'Over Limit Product',
          unitPrice: '99.99',
          costPrice: '49.99',
        })
        .expect(403);

      expect(res.body.message).toContain('Plan limit reached for MAX_PRODUCTS');
    });
  });

  describe('4. Invoice Creation Plan Limit Enforcement (MAX_INVOICES)', () => {
    it('blocks invoice creation with 403 Forbidden when MAX_INVOICES limit is reached', async () => {
      const currentInvoices = await prisma.invoice.count({
        where: { tenantId: testData.tenantA.id },
      });

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

      const res = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          tenantId: testData.tenantA.id,
          clientId: testData.tenantAClient.id,
          invoiceNumber: `INV-LMT-${Date.now()}`,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          subtotal: '100.00',
          tax: '0',
          discount: '0',
          total: '100.00',
          paidAmount: '0',
          balanceAmount: '100.00',
          status: 'SENT',
        })
        .expect(403);

      expect(res.body.message).toContain('Plan limit reached for MAX_INVOICES');
    });
  });

  describe('5. Warehouse Creation Plan Limit Enforcement (MAX_WAREHOUSES)', () => {
    it('blocks warehouse creation with 403 Forbidden when MAX_WAREHOUSES limit is reached', async () => {
      const currentWarehouses = await prisma.warehouse.count({
        where: { tenantId: testData.tenantA.id },
      });

      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      await prisma.planLimit.upsert({
        where: {
          planId_resourceCode: {
            planId: sub!.planId,
            resourceCode: 'MAX_WAREHOUSES',
          },
        },
        update: { limitValue: currentWarehouses },
        create: {
          planId: sub!.planId,
          resourceCode: 'MAX_WAREHOUSES',
          limitValue: currentWarehouses,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: `Warehouse-LMT-${Date.now()}`,
          location: 'East Wing',
        })
        .expect(403);

      expect(res.body.message).toContain('Plan limit reached for MAX_WAREHOUSES');
    });
  });

  describe('6. Feature Gating Enforcement', () => {
    it('rejects access to features not included in the plan', async () => {
      // Test feature not in plan
      await expect(
        entitlementService.enforceFeature(testData.tenantA.id, 'NON_EXISTENT_FEATURE'),
      ).rejects.toThrow('Your plan does not have access to feature');

      // Test feature included in default plan (PROJECTS)
      await expect(
        entitlementService.enforceFeature(testData.tenantA.id, 'PROJECTS'),
      ).resolves.toBeUndefined();
    });

    it('returns false for features if subscription is inactive or cancelled', async () => {
      const sub = await prisma.tenantSubscription.findUnique({
        where: { tenantId: testData.tenantA.id },
      });

      // Temporarily mark subscription CANCELLED
      await prisma.tenantSubscription.update({
        where: { id: sub!.id },
        data: { status: 'CANCELLED' },
      });

      const hasFeature = await entitlementService.hasFeature(testData.tenantA.id, 'PROJECTS');
      expect(hasFeature).toBe(false);

      // Restore to ACTIVE
      await prisma.tenantSubscription.update({
        where: { id: sub!.id },
        data: { status: 'ACTIVE' },
      });

      const hasFeatureRestored = await entitlementService.hasFeature(testData.tenantA.id, 'PROJECTS');
      expect(hasFeatureRestored).toBe(true);
    });
  });
});
