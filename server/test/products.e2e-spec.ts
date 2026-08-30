import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, ProductStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Products Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminId: string;
  let adminToken: string;
  let testTenantId: string;
  let otherTenantId: string;
  let otherAdminId: string;
  let otherAdminToken: string;

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
        name: 'E2E Product Tenant',
        slug: `e2e-product-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other Product Tenant',
        slug: `e2e-other-product-${Date.now()}`,
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
        await prisma.user.delete({ where: { id: adminId } });
      }
    } catch (error) {}

    try {
      if (otherAdminId) {
        await prisma.user.delete({ where: { id: otherAdminId } });
      }
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      if (testTenantId) {
        await prisma.tenant.delete({ where: { id: testTenantId } });
      }
    } catch (error) {}

    try {
      if (otherTenantId) {
        await prisma.tenant.delete({ where: { id: otherTenantId } });
      }
    } catch (error) {}

    await app.close();
  });

  describe('POST /products', () => {
    it('should create a product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          category: 'Electronics',
          unit: 'pcs',
          purchasePrice: '10.00',
          sellingPrice: '20.00',
          taxRate: '5',
          reorderLevel: '10',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(response.body.data.name).toBe('Test Product');
      expect(response.body.data.sku).toContain('SKU-');
      expect(response.body.data.status).toBe('ACTIVE');

      await prisma.product.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should reject duplicate SKU within same tenant', async () => {
      const sku = `SKU-DUP-${Date.now()}`;
      
      await prisma.product.create({
        data: {
          sku,
          name: 'Product A',
          tenantId: testTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku,
          name: 'Product B',
          status: 'ACTIVE',
        });

      expect(response.status).toBe(409);

      await prisma.product.deleteMany({ where: { sku } });
    });

    it('should allow same SKU in different tenant', async () => {
      const sku = `SKU-SHARED-${Date.now()}`;
      
      await prisma.product.create({
        data: {
          sku,
          name: 'Product A',
          tenantId: testTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .send({
          sku,
          name: 'Product B',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(response.body.data.sku).toBe(sku);

      await prisma.product.deleteMany({ where: { sku } });
    });
  });

  describe('GET /products', () => {
    it('should list products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /products/:id', () => {
    it('should return product details', async () => {
      const product = await prisma.product.create({
        data: {
          sku: `SKU-DETAIL-${Date.now()}`,
          name: 'Detail Product',
          tenantId: testTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(product.id);
      expect(response.body.data.name).toBe('Detail Product');

      await prisma.product.delete({ where: { id: product.id } });
    });

    it('should reject access to another tenant product', async () => {
      const otherProduct = await prisma.product.create({
        data: {
          sku: `SKU-OTHER-${Date.now()}`,
          name: 'Other Tenant Product',
          tenantId: otherTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${otherProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);

      await prisma.product.delete({ where: { id: otherProduct.id } });
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product', async () => {
      const product = await prisma.product.create({
        data: {
          sku: `SKU-UPDATE-${Date.now()}`,
          name: 'Original Product',
          tenantId: testTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          category: 'Updated Category',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Product');
      expect(response.body.data.category).toBe('Updated Category');

      await prisma.product.delete({ where: { id: product.id } });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should deactivate a product', async () => {
      const product = await prisma.product.create({
        data: {
          sku: `SKU-DELETE-${Date.now()}`,
          name: 'To Deactivate',
          tenantId: testTenantId,
          status: ProductStatus.ACTIVE,
        },
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updated = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(updated?.status).toBe(ProductStatus.INACTIVE);
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated product requests', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });
  });
});
