import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, InvoiceStatus, SalesOrderStatus, ProductStatus, ClientStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';

describe('Invoices Management (e2e)', () => {
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
  let salesOrderId: string;

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
        name: 'E2E Invoice Tenant',
        slug: `e2e-invoice-${Date.now()}`,
        maxUsers: 100,
        maxStorage: 10240,
      },
    });
    testTenantId = testTenant.id;

    const otherTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Other Invoice Tenant',
        slug: `e2e-other-invoice-${Date.now()}`,
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
        companyName: 'E2E Invoice Client',
        contactPerson: 'Test Contact',
        email: `client-invoice-e2e-${Date.now()}@test.local`,
        tenantId: testTenantId,
      },
    });
    clientId = client.id;

    const otherClient = await prisma.client.create({
      data: {
        companyName: 'E2E Other Invoice Client',
        contactPerson: 'Other Contact',
        email: `other-client-invoice-e2e-${Date.now()}@test.local`,
        tenantId: otherTenantId,
      },
    });
    otherClientId = otherClient.id;

    const product = await prisma.product.create({
      data: {
        sku: `SKU-INV-${Date.now()}`,
        name: 'Test Invoice Product',
        tenantId: testTenantId,
        status: ProductStatus.ACTIVE,
        sellingPrice: new (require('@prisma/client').Decimal)(100),
      },
    });
    productId = product.id;

    const otherProduct = await prisma.product.create({
      data: {
        sku: `SKU-OTHER-INV-${Date.now()}`,
        name: 'Other Tenant Invoice Product',
        tenantId: otherTenantId,
        status: ProductStatus.ACTIVE,
        sellingPrice: new (require('@prisma/client').Decimal)(100),
      },
    });
    otherProductId = otherProduct.id;
  });

  afterAll(async () => {
    try {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
    } catch (error) {}

    try {
      await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.invoice.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.payment.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: { not: '' } } });
    } catch (error) {}

    try {
      await prisma.salesOrder.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.salesOrder.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.inventory.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.inventory.deleteMany({ where: { tenantId: otherTenantId } });
    } catch (error) {}

    try {
      await prisma.stockMovement.deleteMany({ where: { tenantId: testTenantId } });
    } catch (error) {}

    try {
      await prisma.stockMovement.deleteMany({ where: { tenantId: otherTenantId } });
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

  describe('POST /invoice', () => {
    it('should create an invoice', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          notes: 'Test invoice',
          items: [
            {
              description: 'Test Item',
              quantity: '2',
              unitPrice: '100',
              taxRate: '10',
              discount: '5',
            },
          ],
        })
        .expect(201);

      expect(response.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.items).toHaveLength(1);
      expect(Number(response.body.data.total)).toBeGreaterThan(0);
    });

    it('should reject creation without items', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [],
        });

      expect(response.status).toBe(400);
    });

    it('should reject creation with client from another tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: otherClientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /invoice/from-sales-order/:salesOrderId', () => {
    beforeEach(async () => {
      const so = await prisma.salesOrder.create({
        data: {
          clientId,
          tenantId: testTenantId,
          orderNumber: `SO-INV-${Date.now()}`,
          orderDate: new Date(),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(0),
          totalAmount: new (require('@prisma/client').Decimal)(110),
          items: {
            create: {
              productId,
              description: 'SO Item',
              quantity: new (require('@prisma/client').Decimal)(10),
              unitPrice: new (require('@prisma/client').Decimal)(10),
              lineTotal: new (require('@prisma/client').Decimal)(100),
              fulfilledQuantity: new (require('@prisma/client').Decimal)(6),
            },
          },
        },
      });
      salesOrderId = so.id;
    });

    afterEach(async () => {
      if (salesOrderId) {
        try {
          await prisma.invoiceItem.deleteMany({ where: { invoiceId: { not: '' } } });
        } catch (error) {}
        try {
          await prisma.invoice.deleteMany({ where: { salesOrderId } });
        } catch (error) {}
        try {
          await prisma.salesOrderItem.deleteMany({ where: { salesOrderId } });
        } catch (error) {}
        try {
          await prisma.salesOrder.delete({ where: { id: salesOrderId } });
        } catch (error) {}
        salesOrderId = null as any;
      }
    });

    it('should generate invoice from approved Sales Order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(201);

      expect(response.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(response.body.data.salesOrderId).toBe(salesOrderId);
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should reject invoicing a cancelled Sales Order', async () => {
      await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: SalesOrderStatus.CANCELLED },
      });

      const response = await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should invoice only fulfilled quantities', async () => {
      const response = await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(201);

      const items = response.body.data.items;
      expect(items).toHaveLength(1);
      expect(Number(items[0].quantity)).toBeLessThanOrEqual(6);
    });

    it('should prevent duplicate invoicing of same fulfilled quantity', async () => {
      await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject cross-tenant Sales Order invoice', async () => {
      const otherSo = await prisma.salesOrder.create({
        data: {
          clientId: otherClientId,
          tenantId: otherTenantId,
          orderNumber: `SO-OTHER-INV-${Date.now()}`,
          orderDate: new Date(),
          status: SalesOrderStatus.APPROVED,
          subtotal: new (require('@prisma/client').Decimal)(100),
          taxAmount: new (require('@prisma/client').Decimal)(10),
          discountAmount: new (require('@prisma/client').Decimal)(0),
          totalAmount: new (require('@prisma/client').Decimal)(110),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/invoice/from-sales-order/${otherSo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(404);

      await prisma.salesOrder.delete({ where: { id: otherSo.id } });
    });
  });

  describe('Invoice workflow', () => {
    let invoiceId: string;

    afterEach(async () => {
      if (invoiceId) {
        try {
          await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
        } catch (error) {}
        try {
          await prisma.invoice.delete({ where: { id: invoiceId } });
        } catch (error) {}
        invoiceId = null as any;
      }
    });

    it('should issue a DRAFT invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      const issueResponse = await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(issueResponse.body.data.status).toBe('ISSUED');
      expect(issueResponse.body.data.issuedAt).toBeDefined();
    });

    it('should reject invalid status transition on issue', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should void an ISSUED invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const voidResponse = await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/void`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(voidResponse.body.data.status).toBe('VOID');
    });

    it('should not allow updating an ISSUED invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/invoice/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Updated' });

      expect(response.status).toBe(400);
    });

    it('should not allow deleting an ISSUED invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/invoice/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Payment allocation', () => {
    let invoiceId: string;
    let paymentId: string;

    afterEach(async () => {
      if (paymentId) {
        try {
          await prisma.payment.delete({ where: { id: paymentId } });
        } catch (error) {}
        paymentId = null as any;
      }
      if (invoiceId) {
        try {
          await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
        } catch (error) {}
        try {
          await prisma.invoice.delete({ where: { id: invoiceId } });
        } catch (error) {}
        invoiceId = null as any;
      }
    });

    it('should allocate payment and transition to PARTIALLY_PAID', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          tenantId: testTenantId,
          amount: new (require('@prisma/client').Decimal)(40),
          paymentDate: new Date(),
          method: 'CASH',
        },
      });
      paymentId = payment.id;

      const allocateResponse = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceId,
          amount: '40',
        })
        .expect(201);

      expect(Number(allocateResponse.body.data.invoice.paidAmount)).toBe(40);
      expect(Number(allocateResponse.body.data.invoice.balanceAmount)).toBe(60);
      expect(allocateResponse.body.data.invoice.status).toBe('PARTIALLY_PAID');
    });

    it('should transition to PAID when fully paid', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          tenantId: testTenantId,
          amount: new (require('@prisma/client').Decimal)(100),
          paymentDate: new Date(),
          method: 'CASH',
        },
      });
      paymentId = payment.id;

      const allocateResponse = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceId,
          amount: '100',
        })
        .expect(201);

      expect(Number(allocateResponse.body.data.invoice.paidAmount)).toBe(100);
      expect(Number(allocateResponse.body.data.invoice.balanceAmount)).toBe(0);
      expect(allocateResponse.body.data.invoice.status).toBe('PAID');
    });

    it('should reject over-allocation', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      await request(app.getHttpServer())
        .post(`/invoice/${invoiceId}/issue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          tenantId: testTenantId,
          amount: new (require('@prisma/client').Decimal)(100),
          paymentDate: new Date(),
          method: 'CASH',
        },
      });
      paymentId = payment.id;

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceId,
          amount: '150',
        });

      expect(response.status).toBe(400);
    });

    it('should reject allocation to DRAFT invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      invoiceId = createResponse.body.data.id;

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          tenantId: testTenantId,
          amount: new (require('@prisma/client').Decimal)(100),
          paymentDate: new Date(),
          method: 'CASH',
        },
      });
      paymentId = payment.id;

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceId,
          amount: '50',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('AR Summary', () => {
    it('should return AR summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/invoice/ar-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('totalOutstanding');
      expect(response.body.data).toHaveProperty('totalOverdue');
      expect(response.body.data).toHaveProperty('aging');
    });
  });

  describe('Tenant isolation', () => {
    it('should deny access to other tenant invoice', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/invoice')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId,
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          items: [
            {
              description: 'Test Item',
              quantity: '1',
              unitPrice: '100',
            },
          ],
        })
        .expect(201);

      const invoiceId = createResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/invoice/${invoiceId}`)
        .set('Authorization', `Bearer ${otherAdminToken}`);

      expect(response.status).toBe(403);

      await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
      await prisma.invoice.delete({ where: { id: invoiceId } });
    });
  });

  describe('Authorization', () => {
    it('should deny unauthenticated access', async () => {
      const response = await request(app.getHttpServer())
        .get('/invoice');

      expect(response.status).toBe(401);
    });
  });
});
