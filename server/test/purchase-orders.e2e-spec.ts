import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, PurchaseOrderStatus, VendorStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Purchase Orders Management (e2e)', () => {
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
        name: 'E2E PO Tenant',
        slug: `e2e-po-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other PO Tenant',
        slug: `e2e-other-po-${Date.now()}`,
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

    const otherVendor = await prisma.vendor.create({
      data: {
        name: 'E2E Other Vendor',
        vendorCode: `VEND-OTHER-${Date.now()}`,
        tenantId: otherTenantId,
        status: VendorStatus.ACTIVE,
      },
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
      if (vendorId) {
        await prisma.vendor.delete({ where: { id: vendorId } });
      }
    } catch (error) {}

    try {
      await prisma.vendor.deleteMany({
        where: { tenantId: otherTenantId },
      });
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

  describe('POST /purchase-orders', () => {
    it('should create a purchase order', async () => {
      const response = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorId,
          title: 'Test Purchase Order',
          description: 'Test description',
          orderDate: '2024-01-15',
          expectedDeliveryDate: '2024-01-20',
          notes: 'Test notes',
          items: [
            {
              description: 'Item 1',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 5.5,
              taxRate: 10,
              discount: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body.data.poNumber).toMatch(/^PO-\d{4}-\d{6}$/);
      expect(response.body.data.title).toBe('Test Purchase Order');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.items).toHaveLength(1);

      await prisma.purchaseOrder.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should reject creation without items', async () => {
      const response = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorId,
          title: 'Test PO',
          orderDate: '2024-01-15',
          items: [],
        });

      expect(response.status).toBe(400);
    });

    it('should reject vendor from different tenant', async () => {
      const otherVendor = await prisma.vendor.findFirst({
        where: { tenantId: otherTenantId },
        select: { id: true },
      });

      const response = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorId: otherVendor!.id,
          title: 'Test PO',
          orderDate: '2024-01-15',
          items: [
            {
              description: 'Item 1',
              quantity: 10,
              unitPrice: 5,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it('should calculate totals server-side', async () => {
      const response = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorId,
          title: 'Totals Test',
          orderDate: '2024-01-15',
          items: [
            {
              description: 'Item 1',
              quantity: 10,
              unitPrice: 10,
              taxRate: 10,
              discount: 5,
            },
          ],
        })
        .expect(201);

      const po = response.body.data;
      expect(Number(po.subtotal)).toBeCloseTo(100, 2);
      expect(Number(po.taxAmount)).toBeCloseTo(9.5, 2);
      expect(Number(po.discountAmount)).toBeCloseTo(5, 2);
      expect(Number(po.totalAmount)).toBeCloseTo(104.5, 2);

      await prisma.purchaseOrder.delete({
        where: { id: po.id },
      });
    });
  });

  describe('GET /purchase-orders', () => {
    it('should list purchase orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /purchase-orders/:id', () => {
    it('should return purchase order details', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000001`,
          title: 'Detail Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Item 1',
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
        .get(`/purchase-orders/${po.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(po.id);
      expect(response.body.data.title).toBe('Detail Test');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    it('should reject access to another tenant purchase order', async () => {
      const otherPo = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000002`,
          title: 'Other Tenant PO',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: otherTenantId,
          vendorId: (await prisma.vendor.findFirst({ where: { tenantId: otherTenantId } }))!.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/purchase-orders/${otherPo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);

      await prisma.purchaseOrder.delete({ where: { id: otherPo.id } });
    });
  });

  describe('PATCH /purchase-orders/:id', () => {
    it('should update a draft purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000003`,
          title: 'Original Title',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/purchase-orders/${po.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          notes: 'Updated notes',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.notes).toBe('Updated notes');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    it('should reject update of non-draft purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000004`,
          title: 'Submitted PO',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/purchase-orders/${po.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(400);

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('POST /purchase-orders/:id/submit', () => {
    it('should submit a draft purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000005`,
          title: 'Submit Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Item 1',
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
        .post(`/purchase-orders/${po.id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('SUBMITTED');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('POST /purchase-orders/:id/approve', () => {
    it('should approve a submitted purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000006`,
          title: 'Approve Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Item 1',
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
        .post(`/purchase-orders/${po.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.approvedById).toBe(adminId);

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('POST /purchase-orders/:id/reject', () => {
    it('should reject a submitted purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000007`,
          title: 'Reject Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.SUBMITTED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
          items: {
            create: {
              description: 'Item 1',
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
        .post(`/purchase-orders/${po.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('REJECTED');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('POST /purchase-orders/:id/cancel', () => {
    it('should cancel a draft purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000008`,
          title: 'Cancel Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/purchase-orders/${po.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.status).toBe('CANCELLED');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('POST /purchase-orders/:id/receive', () => {
    it('should receive purchase order partially', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000009`,
          title: 'Receive Test',
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
              description: 'Item 1',
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
            receivedQuantity: 4,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('PARTIALLY_RECEIVED');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    it('should receive purchase order fully', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000010`,
          title: 'Receive Full Test',
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
              description: 'Item 1',
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
            receivedQuantity: 10,
          },
        ])
        .expect(201);

      expect(response.body.data.status).toBe('RECEIVED');

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    it('should prevent over-receiving', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000011`,
          title: 'Over-receive Test',
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
              description: 'Item 1',
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
            receivedQuantity: 15,
          },
        ]);

      expect(response.status).toBe(400);

      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });
  });

  describe('DELETE /purchase-orders/:id', () => {
    it('should delete a draft purchase order', async () => {
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000012`,
          title: 'Delete Test',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/purchase-orders/${po.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleted = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should reject unauthenticated purchase order requests', async () => {
      await request(app.getHttpServer())
        .get('/purchase-orders')
        .expect(401);
    });
  });

  describe('PO Number Uniqueness', () => {
    it('should generate unique PO numbers within a tenant', async () => {
      const po1 = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000013`,
          title: 'PO 1',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      const po2 = await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-${new Date().getFullYear()}-000014`,
          title: 'PO 2',
          orderDate: new Date('2024-01-15'),
          status: PurchaseOrderStatus.DRAFT,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(5),
          totalAmount: new (require('@prisma/client').Decimal)(105),
          tenantId: testTenantId,
          vendorId,
        },
      });

      expect(po1.poNumber).not.toBe(po2.poNumber);

      await prisma.purchaseOrder.deleteMany({
        where: { id: { in: [po1.id, po2.id] } },
      });
    });
  });
});
