import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, PurchaseOrderStatus, VendorStatus, ProductStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Inventory Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminId: string;
  let adminToken: string;
  let testTenantId: string;
  let otherTenantId: string;
  let otherAdminId: string;
  let otherAdminToken: string;
  let vendorId: string;
  let productId: string;

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
        name: 'E2E Inventory Tenant',
        slug: `e2e-inventory-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other Inventory Tenant',
        slug: `e2e-other-inventory-${Date.now()}`,
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

    const vendor = await prisma.vendor.create({
      data: {
        name: 'E2E Vendor',
        vendorCode: `VEND-${Date.now()}`,
        tenantId: testTenantId,
        status: VendorStatus.ACTIVE,
      },
    });
    vendorId = vendor.id;

    const product = await prisma.product.create({
      data: {
        sku: `SKU-${Date.now()}`,
        name: 'Test Product',
        tenantId: testTenantId,
        status: ProductStatus.ACTIVE,
      },
    });
    productId = product.id;
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
      await prisma.stockMovement.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.inventory.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.stockMovement.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.inventory.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.purchaseOrder.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.purchaseOrder.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      if (vendorId) {
        await prisma.vendor.delete({ where: { id: vendorId } });
      }
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

  describe('GET /inventory', () => {
    it('should list inventory', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /inventory/:productId', () => {
    it('should return inventory details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('GET /inventory/:productId/movements', () => {
    it('should return movement history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/${productId}/movements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /inventory/:productId/adjust', () => {
    it('should adjust stock IN', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'ADJUSTMENT_IN',
          quantity: 10,
          note: 'Initial stock adjustment',
        })
        .expect(201);

      expect(response.body.data.quantity).toBe('10');

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('ADJUSTMENT_IN');
    });

    it('should adjust stock OUT', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'ADJUSTMENT_OUT',
          quantity: 5,
          note: 'Stock removal',
        })
        .expect(201);

      expect(response.body.data.quantity).toBe('5');
    });

    it('should prevent adjusting below zero', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'ADJUSTMENT_OUT',
          quantity: 20,
          note: 'Too much removal',
        });

      expect(response.status).toBe(400);
    });

    it('should require note for adjustment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'ADJUSTMENT_IN',
          quantity: 5,
          note: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PO Receiving Integration', () => {
    it('should create stock movement when receiving PO with product', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-${Date.now()}`,
          title: 'Inventory Test PO',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              receivedQuantity: new (require('@prisma/client').Decimal)(0),
              productId,
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .post(`/purchase-orders/${po.id}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: po.items[0].id,
            receivedQuantity: 5,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('PARTIALLY_RECEIVED');

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId },
      });
      expect(movements.length).toBeGreaterThanOrEqual(1);
      const receiptMovement = movements.find(m => m.type === 'PURCHASE_RECEIPT');
      expect(receiptMovement).toBeDefined();
      expect(Number(receiptMovement?.quantity)).toBe(5);

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    it('should not create inventory movement for non-product PO items', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-${Date.now()}`,
          title: 'Non-Product PO',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Free Text Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              receivedQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .post(`/purchase-orders/${po.id}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: po.items[0].id,
            receivedQuantity: 5,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('PARTIALLY_RECEIVED');

      const movements = await prisma.stockMovement.findMany({
        where: { tenantId: testTenantId },
      });
      const poMovements = movements.filter(m => m.referenceId === po.id);
      expect(poMovements).toHaveLength(0);

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated inventory requests', async () => {
      await request(app.getHttpServer())
        .get('/inventory')
        .expect(401);
    });
  });
});
