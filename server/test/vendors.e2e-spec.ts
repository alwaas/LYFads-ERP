import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, VendorStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Vendors Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminId: string;
  let adminToken: string;
  let superAdminId: string;
  let superAdminToken: string;
  let testTenantId: string;
  let otherTenantId: string;
  let otherAdminId: string;
  let otherAdminToken: string;

  const testEmail = `admin-e2e-${Date.now()}@test.local`;
  const superAdminEmail = `superadmin-e2e-${Date.now()}@test.local`;

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
        name: 'E2E Vendor Tenant',
        slug: `e2e-vendor-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other Vendor Tenant',
        slug: `e2e-other-vendor-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    otherTenantId = otherTenant.id;

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

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
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

    const otherAdmin = await prisma.user.create({
      data: {
        email: `other-e2e-${Date.now()}@test.local`,
        password: passwordHash,
        fullName: 'E2E Other Admin',
        role: UserRole.ADMIN,
        tenant: {
          connect: { id: otherTenant.id },
        },
      },
    });
    otherAdminId = otherAdmin.id;

    otherAdminToken = jwtService.sign({
      sub: otherAdmin.id,
      email: otherAdmin.email,
      role: otherAdmin.role,
      tenantId: otherAdmin.tenantId,
      fullName: otherAdmin.fullName,
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
      if (superAdminId) {
        await prisma.user.delete({
          where: { id: superAdminId },
        });
      }
    } catch (error) {
      // cleanup best-effort
    }

    try {
      if (otherAdminId) {
        await prisma.user.delete({
          where: { id: otherAdminId },
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

    try {
      if (otherTenantId) {
        await prisma.tenant.delete({
          where: { id: otherTenantId },
        });
      }
    } catch (error) {
      // cleanup best-effort
    }

    await app.close();
  });

  describe('POST /vendors', () => {
    it('should create a vendor', async () => {
      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Acme Supplies',
          vendorCode: 'VEND-001',
          contactPerson: 'John Doe',
          email: 'john@acme.com',
          phone: '1234567890',
          city: 'New York',
          country: 'USA',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(response.body.data.name).toBe('Acme Supplies');
      expect(response.body.data.vendorCode).toBe('VEND-001');
      expect(response.body.data.email).toBe('john@acme.com');

      await prisma.vendor.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should reject duplicate vendorCode within same tenant', async () => {
      await prisma.vendor.create({
        data: {
          name: 'Vendor A',
          vendorCode: 'DUP-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Vendor B',
          vendorCode: 'DUP-001',
          status: 'ACTIVE',
        });

      expect(response.status).toBe(409);

      await prisma.vendor.deleteMany({
        where: { vendorCode: 'DUP-001', tenantId: testTenantId },
      });
    });

    it('should allow same vendorCode in different tenant', async () => {
      await prisma.vendor.create({
        data: {
          name: 'Vendor A',
          vendorCode: 'SHARED-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .send({
          name: 'Vendor B',
          vendorCode: 'SHARED-001',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(response.body.data.vendorCode).toBe('SHARED-001');

      await prisma.vendor.deleteMany({
        where: { vendorCode: 'SHARED-001' },
      });
    });
  });

  describe('GET /vendors', () => {
    it('should list vendors', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should filter vendors by search', async () => {
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Searchable Vendor',
          vendorCode: 'SEARCH-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/vendors?search=Searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = response.body.data.data.some(
        (v: any) => v.id === vendor.id,
      );
      expect(found).toBe(true);

      await prisma.vendor.delete({
        where: { id: vendor.id },
      });
    });
  });

  describe('GET /vendors/:id', () => {
    it('should return vendor details', async () => {
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Detail Vendor',
          vendorCode: 'DETAIL-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(vendor.id);
      expect(response.body.data.name).toBe('Detail Vendor');

      await prisma.vendor.delete({
        where: { id: vendor.id },
      });
    });

    it('should reject access to another tenant vendor', async () => {
      const otherVendor = await prisma.vendor.create({
        data: {
          name: 'Other Tenant Vendor',
          vendorCode: 'OTHER-001',
          tenantId: otherTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/vendors/${otherVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);

      await prisma.vendor.delete({
        where: { id: otherVendor.id },
      });
    });
  });

  describe('PATCH /vendors/:id', () => {
    it('should update a vendor', async () => {
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Original Vendor',
          vendorCode: 'UPDATE-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Vendor',
          phone: '9876543210',
          status: 'INACTIVE',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Vendor');
      expect(response.body.data.phone).toBe('9876543210');
      expect(response.body.data.status).toBe('INACTIVE');

      await prisma.vendor.delete({
        where: { id: vendor.id },
      });
    });
  });

  describe('DELETE /vendors/:id', () => {
    it('should delete a vendor', async () => {
      const vendor = await prisma.vendor.create({
        data: {
          name: 'To Delete',
          vendorCode: 'DELETE-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .delete(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const deleted = await prisma.vendor.findUnique({
        where: { id: vendor.id },
      });

      expect(deleted).toBeNull();
    });

    it('should not corrupt historical expenses when vendor is deleted', async () => {
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Expense Vendor',
          vendorCode: 'EXP-VEND-001',
          tenantId: testTenantId,
          status: VendorStatus.ACTIVE,
        },
      });

      const expense = await prisma.expense.create({
        data: {
          description: 'Vendor Expense',
          amount: 500,
          expenseDate: new Date('2024-01-20'),
          category: 'OFFICE_SUPPLIES',
          paymentMethod: 'CASH',
          vendor: 'Expense Vendor',
          vendorId: vendor.id,
          tenantId: testTenantId,
          userId: adminId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/vendors/${vendor.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const updatedExpense = await prisma.expense.findUnique({
        where: { id: expense.id },
      });

      expect(updatedExpense).not.toBeNull();
      expect(updatedExpense?.vendorId).toBeNull();
      expect(updatedExpense?.vendor).toBe('Expense Vendor');

      await prisma.expense.delete({
        where: { id: expense.id },
      });
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated vendor requests', async () => {
      await request(app.getHttpServer())
        .get('/vendors')
        .expect(401);
    });
  });
});
