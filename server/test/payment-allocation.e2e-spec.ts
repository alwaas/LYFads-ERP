import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { PaymentStatus } from '@prisma/client';

describe('Payment Allocation & Status E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: {
    tenantA: { id: string };
    tenantB: { id: string };
    tenantAAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantBAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAClient: { id: string };
    tenantBClient: { id: string };
    tenantAInvoice: { id: string };
    tenantBInvoice: { id: string };
    tenantAPayment: { id: string };
    tenantBPayment: { id: string };
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
      await prisma.paymentAllocation.deleteMany();
      await prisma.payment.deleteMany();
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

  describe('Payment Status', () => {
    it('should create payment with ACTIVE status by default', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should void a payment', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      const voidResponse = await request(app.getHttpServer())
        .post(`/payments/${id}/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(voidResponse.body.data.status).toBe('VOIDED');
      expect(voidResponse.body.data.voidedAt).toBeDefined();
    });

    it('should reject double void', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      await request(app.getHttpServer())
        .post(`/payments/${id}/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/payments/${id}/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('should not update voided payment', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const id = createResponse.body.data.id;
      await request(app.getHttpServer())
        .post(`/payments/${id}/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/payments/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: '200.00' })
        .expect(409);
    });
  });

  describe('Payment Allocation', () => {
    it('should create payment allocation', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const paymentId = paymentResponse.body.data.id;
      const allocationResponse = await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
        })
        .expect(201);

      expect(allocationResponse.body.data.paymentId).toBe(paymentId);
      expect(allocationResponse.body.data.invoiceId).toBe(testData.tenantAInvoice.id);
      expect(Number(allocationResponse.body.data.amount)).toBe(100);
    });

    it('should reject allocation to another tenant invoice', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const paymentId = paymentResponse.body.data.id;
      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantBInvoice.id,
          amount: '50.00',
        })
        .expect(403);
    });

    it('should reject allocation against voided payment', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const paymentId = paymentResponse.body.data.id;
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantAInvoice.id,
          amount: '50.00',
        })
        .expect(409);
    });

    it('should prevent over-allocation', async () => {
      const token = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const paymentId = paymentResponse.body.data.id;
      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantAInvoice.id,
          amount: '50.00',
        })
        .expect(409);
    });
  });

  describe('Cross-Tenant Isolation', () => {
    it('should not allow tenant B to void tenant A payment', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const id = paymentResponse.body.data.id;
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .post(`/payments/${id}/void`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should not allow tenant B to create allocation for tenant A payment', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          invoiceId: testData.tenantAInvoice.id,
          amount: '100.00',
          paymentDate: new Date().toISOString().split('T')[0],
          method: 'CASH',
        })
        .expect(201);

      const paymentId = paymentResponse.body.data.id;
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .post('/payment-allocations')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          paymentId: paymentId,
          invoiceId: testData.tenantBInvoice.id,
          amount: '50.00',
        })
        .expect(403);
    });
  });
});
