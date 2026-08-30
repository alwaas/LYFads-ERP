import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, SalesOrderStatus, ClientStatus, ProductStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Sales Orders Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let adminId: string;
  let adminToken: string;
  let testTenantId: string;
  let otherTenantId: string;
  let otherAdminId: string;
  let otherAdminToken: string;
  let clientId: string;
  let otherClientId: string;
  let productId: string;
  let otherProductId: string;

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
        name: 'E2E SO Tenant',
        slug: `e2e-so-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other SO Tenant',
        slug: `e2e-other-so-${Date.now()}`,
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

    const client = await prisma.client.create({
      data: {
        companyName: 'E2E Client',
        contactPerson: 'Test Contact',
        email: `client-e2e-${Date.now()}@test.local`,
        tenantId: testTenantId,
      },
    });
    clientId = client.id;

    const otherClient = await prisma.client.create({
      data: {
        companyName: 'E2E Other Client',
        contactPerson: 'Other Contact',
        email: `other-client-e2e-${Date.now()}@test.local`,
        tenantId: otherTenantId,
      },
    });
    otherClientId = otherClient.id;

    const product = await prisma.product.create({
      data: {
        sku: `SKU-SO-${Date.now()}`,
        name: 'Test Product',
        tenantId: testTenantId,
        status: ProductStatus.ACTIVE,
      },
    });
    productId = product.id;

    const otherProduct = await prisma.product.create({
      data: {
        sku: `SKU-OTHER-SO-${Date.now()}`,
        name: 'Other Tenant Product',
        tenantId: otherTenantId,
        status: ProductStatus.ACTIVE,
      },
    });
    otherProductId = otherProduct.id;
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
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: { not: '' } } });
    } catch (error) {}

    try {
      await prisma.salesOrder.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: { not: '' } } });
    } catch (error) {}

    try {
      await prisma.salesOrder.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.product.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.client.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.client.deleteMany({ where: { tenantId: otherTenantId } });
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

  describe('POST /sales-orders', () => {
    it('should create a sales order', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          orderDate: '2024-01-15',
          expectedDeliveryDate: '2024-01-20',
          notes: 'Test notes',
          items: [
            {
              productId,
              description: 'Test Item',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 5.5,
              taxRate: 10,
              discount: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body.data.orderNumber).toMatch(/^SO-\d{4}-\d{6}$/);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.items).toHaveLength(1);

      await prisma.salesOrder.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should reject creation without items', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          orderDate: '2024-01-15',
          items: [],
        });

      expect(response.status).toBe(400);
    });

    it('should reject client from different tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: otherClientId,
          orderDate: '2024-01-15',
          items: [
            {
              productId,
              description: 'Test Item',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 5.5,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it('should reject product from different tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          orderDate: '2024-01-15',
          items: [
            {
              productId: otherProductId,
              description: 'Test Item',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 5.5,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it('should calculate totals server-side', async () => {
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          orderDate: '2024-01-15',
          items: [
            {
              productId,
              description: 'Test Item',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 5.5,
              taxRate: 10,
              discount: 2,
            },
          ],
        })
        .expect(201);

      const subtotal = 10 * 5.5;
      const discountAmount = 2;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * 0.1;
      const expectedTotal = taxableAmount + taxAmount;

      expect(Number(response.body.data.subtotal)).toBeCloseTo(subtotal, 2);
      expect(Number(response.body.data.taxAmount)).toBeCloseTo(taxAmount, 2);
      expect(Number(response.body.data.totalAmount)).toBeCloseTo(expectedTotal, 2);

      await prisma.salesOrder.delete({
        where: { id: response.body.data.id },
      });
    });
  });

  describe('GET /sales-orders', () => {
    it('should list sales orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /sales-orders/:id', () => {
    it('should return sales order details', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .get(`/sales-orders/${so.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(so.id);
      expect(response.body.data.items).toHaveLength(1);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should reject access to another tenant sales order', async () => {
      const otherSo = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: otherTenantId,
          clientId: otherClientId,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/sales-orders/${otherSo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);

      await prisma.salesOrder.delete({ where: { id: otherSo.id } });
    });
  });

  describe('PATCH /sales-orders/:id', () => {
    it('should update a draft sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .patch(`/sales-orders/${so.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated notes',
          items: [
            {
              productId,
              description: 'Updated Item',
              quantity: 20,
              unit: 'pcs',
              unitPrice: 6,
              taxRate: 12,
              discount: 3,
            },
          ],
        })
        .expect(200);

      expect(response.body.data.notes).toBe('Updated notes');
      expect(response.body.data.items).toHaveLength(1);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should reject update after submission', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/sales-orders/${so.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated notes',
        });

      expect(response.status).toBe(400);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });
  });

  describe('DELETE /sales-orders/:id', () => {
    it('should delete a draft sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/sales-orders/${so.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleted = await prisma.salesOrder.findUnique({
        where: { id: so.id },
      });

      expect(deleted).toBeNull();
    });

    it('should reject deletion of approved sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/sales-orders/${so.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });
  });

  describe('Workflow', () => {
    it('should submit a draft sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('SUBMITTED');

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should approve a submitted sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.approvedById).toBe(adminId);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should reject a submitted sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('REJECTED');

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should cancel a draft sales order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('CANCELLED');

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should reject invalid status transition', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.REJECTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);

      await prisma.salesOrder.delete({ where: { id: so.id } });
    });
  });

  describe('POST /sales-orders/:id/fulfill', () => {
    it('should fulfill an approved order', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(10),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 4,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('PARTIALLY_FULFILLED');
      expect(response.body.data.items[0].fulfilledQuantity).toBe('4');

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId, type: 'SALE' },
      });
      const saleMovement = movements.find(m => m.type === 'SALE');
      expect(saleMovement).toBeDefined();
      expect(Number(saleMovement?.quantity)).toBe(4);

      await prisma.stockMovement.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should support partial fulfillment', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(10),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 4,
          },
        ])
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 10,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('FULFILLED');
      expect(response.body.data.items[0].fulfilledQuantity).toBe('10');

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId, type: 'SALE' },
      });
      expect(movements).toHaveLength(2);
      expect(Number(movements[0].quantity)).toBe(4);
      expect(Number(movements[1].quantity)).toBe(6);

      await prisma.stockMovement.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should block insufficient inventory', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(5),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 6,
          },
        ]);

      expect(response.status).toBe(400);

      const inventory = await prisma.inventory.findFirst({
        where: { productId, tenantId: testTenantId },
      });
      expect(Number(inventory?.quantity)).toBe(5);

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId, type: 'SALE' },
      });
      expect(movements).toHaveLength(0);

      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should prevent inventory from going negative', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(5),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 10,
          },
        ]);

      expect(response.status).toBe(400);

      const inventory = await prisma.inventory.findFirst({
        where: { productId, tenantId: testTenantId },
      });
      expect(Number(inventory?.quantity)).toBeGreaterThanOrEqual(0);

      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should create SALE stock movement for every fulfillment', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(10),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 3,
          },
        ])
        .expect(201);

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId, type: 'SALE' },
      });
      expect(movements).toHaveLength(1);

      await prisma.stockMovement.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });

    it('should protect against duplicate fulfillment', async () => {
      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${new Date().getFullYear()}-${Date.now()}`,
          orderDate: new Date('2024-01-15'),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          clientId,
          items: {
            create: {
              productId,
              description: 'Test Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(0),
            },
          },
        },
        include: { items: true },
      });

      await prisma.inventory.create({
        data: {
          productId,
          tenantId: testTenantId,
          quantity: new (require('@prisma/client').Decimal)(10),
          reservedQuantity: new (require('@prisma/client').Decimal)(0),
        },
      });

      await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 4,
          },
        ])
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/fulfill`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            itemId: so.items[0].id,
            fulfillQuantity: 4,
          },
        ])
        .expect(201);

      expect(response.body.data.items[0].fulfilledQuantity).toBe('4');

      const movements = await prisma.stockMovement.findMany({
        where: { productId, tenantId: testTenantId, type: 'SALE' },
      });
      expect(movements).toHaveLength(1);

      const inventory = await prisma.inventory.findFirst({
        where: { productId, tenantId: testTenantId },
      });
      expect(Number(inventory?.quantity)).toBe(6);

      await prisma.stockMovement.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.inventory.deleteMany({ where: { productId, tenantId: testTenantId } });
      await prisma.salesOrder.delete({ where: { id: so.id } });
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/sales-orders')
        .expect(401);
    });
  });
});
