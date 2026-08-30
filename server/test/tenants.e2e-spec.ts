import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Tenants Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let superAdminId: string;
  let superAdminToken: string;
  let testTenantId: string;

  const testEmail = `superadmin-e2e-${Date.now()}@test.local`;

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
        name: 'E2E Super Admin Tenant',
        slug: `e2e-super-admin-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
    },
    });
    testTenantId = testTenant.id;

    const superAdmin = await prisma.user.create({
    data: {
        email: testEmail,
        password: passwordHash,
        fullName: 'E2E Super Admin',
        role: UserRole.SUPER_ADMIN,
        tenant: {
        connect: { id: testTenant.id },
        },
    },
    });

    superAdminId = superAdmin.id;

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      tenantId: superAdmin.tenantId,
      fullName: superAdmin.fullName,
    });
  });

    afterAll(async () => {
    try {
      if (superAdminId) {
        await prisma.user.delete({
          where: { id: superAdminId },
        });
      }
    } catch (error) {
      // Cleanup is best-effort; ignore if record was already removed
    }

    try {
      if (testTenantId) {
        await prisma.tenant.delete({
          where: { id: testTenantId },
        });
      }
    } catch (error) {
      // Cleanup is best-effort; ignore if record was already removed
    }

    await app.close();
    });

  describe('POST /tenants', () => {
    it('should create a tenant as SUPER_ADMIN', async () => {
      const slug = `e2e-tenant-${Date.now()}`;

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'E2E Test Tenant',
          slug,
          maxUsers: 20,
          maxStorage: 2048,
        })
        .expect(201);

      expect(response.body.data.name).toBe('E2E Test Tenant');
      expect(response.body.data.slug).toBe(slug);
      expect(response.body.data.maxUsers).toBe(20);
      expect(response.body.data.maxStorage).toBe(2048);

      await prisma.tenant.delete({
        where: { id: response.body.data.id },
      });
    });
  });

  describe('GET /tenants', () => {
    it('should list tenants for SUPER_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /tenants/:id', () => {
    it('should return tenant details', async () => {
      const slug = `details-test-${Date.now()}`;

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Details Test Tenant',
          slug,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(tenant.id);
      expect(response.body.data.name).toBe('Details Test Tenant');

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('should update tenant settings', async () => {
      const slug = `update-test-${Date.now()}`;

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Update Test Tenant',
          slug,
          maxUsers: 10,
          maxStorage: 1024,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Updated Tenant',
          maxUsers: 50,
          maxStorage: 4096,
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Tenant');
      expect(response.body.data.maxUsers).toBe(50);
      expect(response.body.data.maxStorage).toBe(4096);

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });
  });

  describe('Suspend / Activate', () => {
    it('should suspend and activate a tenant', async () => {
      const slug = `status-test-${Date.now()}`;

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Status Test Tenant',
          slug,
        },
      });

      const suspended = await request(app.getHttpServer())
        .patch(`/tenants/${tenant.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(suspended.body.data.status).toBe('SUSPENDED');

      const activated = await request(app.getHttpServer())
        .patch(`/tenants/${tenant.id}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(activated.body.data.status).toBe('ACTIVE');

      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated tenant management requests', async () => {
      await request(app.getHttpServer())
        .get('/tenants')
        .expect(401);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('should delete a tenant as SUPER_ADMIN', async () => {
      const slug = `delete-test-${Date.now()}`;

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Delete Test Tenant',
          slug,
        },
      });

      await request(app.getHttpServer())
        .delete(`/tenants/${tenant.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const deleted = await prisma.tenant.findUnique({
        where: { id: tenant.id },
      });

      expect(deleted).toBeNull();
    });
  });
});