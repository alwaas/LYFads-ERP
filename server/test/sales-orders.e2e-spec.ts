import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Sales Orders E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: {
    tenantA: { id: string };
    tenantB: { id: string };
    tenantAAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAManager: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBManager: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAEmployee: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBEmployee: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAClient: { id: string };
    tenantBClient: { id: string };
    tenantAProduct: { id: string };
    tenantBProduct: { id: string };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  afterEach(async () => {
    try {
      await prisma.activityLog.deleteMany();
      await prisma.salesOrderItem.deleteMany();
      await prisma.salesOrder.deleteMany();
    } catch (error) {
      // Tables may not exist if migration hasn't been applied
    }
  });

  const generateToken = (user: any) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated access to sales orders', async () => {
      await request(app.getHttpServer())
        .get('/sales-orders')
        .expect(401);
    });

    it('should reject unauthenticated access to create sales order', async () => {
      await request(app.getHttpServer())
        .post('/sales-orders')
        .send({})
        .expect(401);
    });
  });

  describe('Role Restrictions', () => {
    it('should reject EMPLOYEE access to sales orders', async () => {
      const token = generateToken(testData.tenantAEmployee);
      await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject CLIENT access to sales orders', async () => {
      const token = generateToken({
        id: testData.tenantAClient.id,
        email: 'client@test.com',
        role: 'CLIENT',
        tenantId: testData.tenantA.id,
        fullName: 'Test Client',
      });
      await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow ADMIN access to sales orders', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should allow MANAGER access to sales orders', async () => {
      const token = generateToken(testData.tenantAManager);
      await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a sales order', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
          notes: 'Test order',
        })
        .expect(201);

      expect(response.body.data.orderNumber).toBe('SO-001');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.clientId).toBe(testData.tenantAClient.id);
    });

    it('should list sales orders for tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-LIST-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const listResponse = await request(app.getHttpServer())
        .get('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(listResponse.body.data).toBeDefined();
      expect(listResponse.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('should get sales order by ID', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-GET-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .get(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.id).toBe(id);
      expect(response.body.data.orderNumber).toBe('SO-GET-001');
    });

    it('should update a sales order', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-UPDATE-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .patch(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Updated notes',
        })
        .expect(200);

      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should delete a sales order', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-DELETE-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      await request(app.getHttpServer())
        .delete(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not allow tenant B to access tenant A sales order', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          orderNumber: 'SO-TENANT-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .get(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should not allow tenant B to update tenant A sales order', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          orderNumber: 'SO-TENANT-UPDATE-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .patch(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ notes: 'Hacked' })
        .expect(403);
    });

    it('should not allow tenant B to delete tenant A sales order', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          orderNumber: 'SO-TENANT-DELETE-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .delete(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });
  });

  describe('Status Workflow', () => {
    it('should transition from DRAFT to CONFIRMED', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should transition from CONFIRMED to PROCESSING', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-002',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/process`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('PROCESSING');
    });

    it('should transition from PROCESSING to FULFILLED', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-003',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'PROCESSING',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/fulfill`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('FULFILLED');
    });

    it('should allow cancellation from DRAFT', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-004',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const response = await request(app.getHttpServer())
        .post(`/sales-orders/${id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should reject invalid status transition from FULFILLED to CANCELLED', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-005',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'FULFILLED',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      await request(app.getHttpServer())
        .post(`/sales-orders/${id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('should not allow deletion of FULFILLED sales order', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-STATUS-006',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'FULFILLED',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      await request(app.getHttpServer())
        .delete(`/sales-orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });
  });

  describe('Validation', () => {
    it('should reject creation with invalid client', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-VALID-001',
          clientId: 'invalid-client-id',
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(403);
    });

    it('should reject duplicate order number within tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-DUP-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-DUP-001',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
        })
        .expect(409);
    });

    it('should reject creation with tenantId mismatch', async () => {
      const token = generateToken(testData.tenantAAdmin);
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNumber: 'SO-VALID-002',
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: '100.00',
          tax: '10.00',
          total: '110.00',
          tenantId: testData.tenantB.id,
        })
        .expect(403);
    });
  });
});
