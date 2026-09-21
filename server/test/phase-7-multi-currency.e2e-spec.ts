import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import { PaymentMethod } from '@prisma/client';

describe('Phase 7 Multi-Currency Foundation & Base Currency (PRD-002)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
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

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  const tenantAToken = () =>
    jwtService.sign({
      sub: testData.tenantAAdmin.id,
      email: testData.tenantAAdmin.email,
      role: testData.tenantAAdmin.role,
      tenantId: testData.tenantA.id,
      fullName: testData.tenantAAdmin.fullName,
    });

  const tenantBToken = () =>
    jwtService.sign({
      sub: testData.tenantBAdmin.id,
      email: testData.tenantBAdmin.email,
      role: testData.tenantBAdmin.role,
      tenantId: testData.tenantB.id,
      fullName: testData.tenantBAdmin.fullName,
    });

  const unwrap = (res: request.Response) => res.body.data ?? res.body;

  describe('1. Tenant Base Currency Configuration', () => {
    it('Tenant A should have base currency configured (default USD)', async () => {
      const res = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .expect(200);

      const body = unwrap(res);
      expect(body.currency).toBe('USD');
    });

    it('Tenant B should be able to update base operating currency to EUR', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch('/settings')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({ currency: 'EUR' })
        .expect(200);

      const body = unwrap(updateRes);
      expect(body.currency).toBe('EUR');

      const tenantBInDb = await prisma.tenant.findUnique({
        where: { id: testData.tenantB.id },
      });
      expect(tenantBInDb?.currency).toBe('EUR');
    });
  });

  describe('2. Sales Documents Currency Handling', () => {
    it('Sales order for Tenant A inherits USD, Tenant B inherits EUR', async () => {
      const soResA = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          orderNumber: `SO-CURR-A-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '200.00',
          total: '200.00',
          items: [
            {
              productId: testData.tenantAProduct.id,
              quantity: '2.00',
              unitPrice: '100.00',
            },
          ],
        })
        .expect(201);

      const soA = unwrap(soResA);
      expect(soA.currency).toBe('USD');

      const soResB = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          orderNumber: `SO-CURR-B-${Date.now()}`,
          clientId: testData.tenantBClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '450.00',
          total: '450.00',
          items: [
            {
              productId: testData.tenantBProduct.id,
              quantity: '3.00',
              unitPrice: '150.00',
            },
          ],
        })
        .expect(201);

      const soB = unwrap(soResB);
      expect(soB.currency).toBe('EUR');
    });

    it('Invoice created inherits tenant base currency or explicitly specified currency', async () => {
      // Inherits Tenant A base currency (USD)
      const invRes1 = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          invoiceNumber: `INV-CURR-1-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          subtotal: '200.00',
          total: '200.00',
          balanceAmount: '200.00',
          tenantId: testData.tenantA.id,
        })
        .expect(201);

      const inv1 = unwrap(invRes1);
      expect(inv1.currency).toBe('USD');

      // Explicit currency GBP
      const invRes2 = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          invoiceNumber: `INV-CURR-2-${Date.now()}`,
          clientId: testData.tenantAClient.id,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          subtotal: '300.00',
          total: '300.00',
          balanceAmount: '300.00',
          currency: 'GBP',
          tenantId: testData.tenantA.id,
        })
        .expect(201);

      const inv2 = unwrap(invRes2);
      expect(inv2.currency).toBe('GBP');

      // Tenant B inherits EUR
      const invResB = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          invoiceNumber: `INV-CURR-B-${Date.now()}`,
          clientId: testData.tenantBClient.id,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          subtotal: '500.00',
          total: '500.00',
          balanceAmount: '500.00',
          tenantId: testData.tenantB.id,
        })
        .expect(201);

      const invB = unwrap(invResB);
      expect(invB.currency).toBe('EUR');
    });

    it('Converting sales order to invoice preserves sales order currency', async () => {
      // Create confirmed sales order in Tenant B (currency EUR)
      const soRes = await request(app.getHttpServer())
        .post('/sales-orders')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          orderNumber: `SO-CONV-${Date.now()}`,
          clientId: testData.tenantBClient.id,
          orderDate: new Date().toISOString(),
          subtotal: '250.00',
          total: '250.00',
          items: [
            {
              productId: testData.tenantBProduct.id,
              quantity: '1.00',
              unitPrice: '250.00',
            },
          ],
        })
        .expect(201);

      const so = unwrap(soRes);
      expect(so.currency).toBe('EUR');

      await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/confirm`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .expect(201);

      const invRes = await request(app.getHttpServer())
        .post(`/sales-orders/${so.id}/create-invoice`)
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        })
        .expect(201);

      const inv = unwrap(invRes);
      expect(inv.currency).toBe('EUR');
    });
  });

  describe('3. Purchase & Expense Documents Currency Handling', () => {
    it('Purchase order and purchase invoice inherit tenant base currency', async () => {
      // PO for Tenant A -> USD
      const poRes = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          orderNumber: `PO-CURR-${Date.now()}`,
          vendorId: testData.tenantAVendor.id,
          orderDate: new Date().toISOString(),
          subtotal: '200.00',
          total: '200.00',
          items: [
            {
              productId: testData.tenantAProduct.id,
              quantity: '5.00',
              unitCost: '40.00',
            },
          ],
        })
        .expect(201);

      const po = unwrap(poRes);
      expect(po.currency).toBe('USD');

      // Vendor Bill for Tenant B -> EUR
      const billRes = await request(app.getHttpServer())
        .post('/purchase-invoices')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          invoiceNumber: `BILL-CURR-${Date.now()}`,
          vendorId: testData.tenantBVendor.id,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          items: [
            {
              description: 'Consulting services',
              quantity: '1.00',
              unitCost: '600.00',
            },
          ],
        })
        .expect(201);

      const bill = unwrap(billRes);
      expect(bill.currency).toBe('EUR');
    });

    it('Expenses inherit tenant base currency or accept explicit currency', async () => {
      const expRes1 = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${tenantAToken()}`)
        .send({
          expenseDate: new Date().toISOString(),
          category: 'Office Supplies',
          description: 'Paper & ink',
          amount: '45.00',
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(201);

      const exp1 = unwrap(expRes1);
      expect(exp1.currency).toBe('USD');

      const expRes2 = await request(app.getHttpServer())
        .post('/expenses')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          expenseDate: new Date().toISOString(),
          category: 'Travel',
          description: 'Train tickets',
          amount: '120.00',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
        })
        .expect(201);

      const exp2 = unwrap(expRes2);
      expect(exp2.currency).toBe('EUR');
    });

    it('Payments inherit tenant base currency', async () => {
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tenantBToken()}`)
        .send({
          amount: '100.00',
          paymentDate: new Date().toISOString(),
          method: PaymentMethod.BANK_TRANSFER,
          remarks: 'Direct payment in tenant base currency',
        })
        .expect(201);

      const payment = unwrap(payRes);
      expect(payment.currency).toBe('EUR');
    });
  });

  describe('4. General Ledger Chart of Accounts Currency', () => {
    it('GL accounts initialized for tenant store the tenant base currency', async () => {
      const accountsA = await prisma.account.findMany({
        where: { tenantId: testData.tenantA.id },
      });
      expect(accountsA.length).toBeGreaterThan(0);
      accountsA.forEach((acc) => {
        expect(acc.currency).toBe('USD');
      });
    });
  });
});
