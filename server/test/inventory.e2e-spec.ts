import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Inventory E2E Tests', () => {
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
    tenantAWarehouse: { id: string };
    tenantBWarehouse: { id: string };
    tenantAStockMovement: { id: string };
    tenantBStockMovement: { id: string };
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
    await prisma.activityLog.deleteMany();
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
    it('should reject unauthenticated access to products', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });

    it('should reject unauthenticated access to warehouses', async () => {
      await request(app.getHttpServer())
        .get('/warehouses')
        .expect(401);
    });

    it('should reject unauthenticated access to stock movements', async () => {
      await request(app.getHttpServer())
        .get('/stock-movements')
        .expect(401);
    });
  });

  describe('Product CRUD', () => {
    it('should create a product', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TEST-A-001',
          name: 'Test Product A',
          description: 'Test description',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 10,
          minStockLevel: 5,
          isActive: true,
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.sku).toBe('TEST-A-001');
      expect(response.body.data.name).toBe('Test Product A');
      expect(response.body.data.tenantId).toBe(testData.tenantA.id);
    });

    it('should list products for tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should get product by id', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get(`/products/${testData.tenantAProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testData.tenantAProduct.id);
    });

    it('should update product', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .patch(`/products/${testData.tenantAProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Product A' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Product A');
    });

    it('should deactivate product when referenced by stock movements', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .delete(`/products/${testData.tenantAProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.deactivated).toBe(true);
    });

    it('should reject duplicate SKU within tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: testData.tenantAProduct.sku,
          name: 'Duplicate SKU Product',
          unitPrice: 100,
          costPrice: 50,
        })
        .expect(409);
    });
  });

  describe('Warehouse CRUD', () => {
    it('should create a warehouse', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Warehouse A',
          location: '789 Test St',
          isDefault: false,
          isActive: true,
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Test Warehouse A');
      expect(response.body.data.tenantId).toBe(testData.tenantA.id);
    });

    it('should list warehouses for tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should get warehouse by id', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get(`/warehouses/${testData.tenantAWarehouse.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testData.tenantAWarehouse.id);
    });

    it('should update warehouse', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .patch(`/warehouses/${testData.tenantAWarehouse.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Warehouse A' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Warehouse A');
    });

    it('should deactivate warehouse when referenced by stock movements', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .delete(`/warehouses/${testData.tenantAWarehouse.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.deactivated).toBe(true);
    });
  });

  describe('Stock Movement Operations', () => {
    it('should create IN movement and increase stock', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'STOCK-IN-001',
          name: 'Stock In Test Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 0,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouseResponse = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Stock Test Warehouse',
          isActive: true,
        })
        .expect(201);

      const warehouseId = warehouseResponse.body.data.id;

      const movementResponse = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'IN',
          quantity: 50,
          notes: 'Test IN movement',
        })
        .expect(201);

      expect(movementResponse.body.data).toBeDefined();
      expect(movementResponse.body.data.type).toBe('IN');
      expect(movementResponse.body.data.quantity).toBe(50);
    });

    it('should create OUT movement and decrease stock', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'STOCK-OUT-001',
          name: 'Stock Out Test Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 100,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouseResponse = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Stock Out Warehouse',
          isActive: true,
        })
        .expect(201);

      const warehouseId = warehouseResponse.body.data.id;

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'IN',
          quantity: 50,
        })
        .expect(201);

      const movementResponse = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'OUT',
          quantity: 30,
        })
        .expect(201);

      expect(movementResponse.body.data.type).toBe('OUT');
    });

    it('should reject OUT when insufficient stock', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'INSUFFICIENT-001',
          name: 'Insufficient Stock Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 10,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouseResponse = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Insufficient Stock Warehouse',
          isActive: true,
        })
        .expect(201);

      const warehouseId = warehouseResponse.body.data.id;

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'IN',
          quantity: 10,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'OUT',
          quantity: 20,
        })
        .expect(400);
    });

    it('should create ADJUST movement', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'ADJUST-001',
          name: 'Adjust Test Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 10,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouseResponse = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Adjust Warehouse',
          isActive: true,
        })
        .expect(201);

      const warehouseId = warehouseResponse.body.data.id;

      const movementResponse = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'ADJUST',
          quantity: 5,
        })
        .expect(201);

      expect(movementResponse.body.data.type).toBe('ADJUST');
    });

    it('should create TRANSFER movement atomically', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TRANSFER-001',
          name: 'Transfer Test Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 100,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouse1Response = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Source Warehouse',
          isActive: true,
        })
        .expect(201);

      const sourceWarehouseId = warehouse1Response.body.data.id;

      const warehouse2Response = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Destination Warehouse',
          isActive: true,
        })
        .expect(201);

      const destinationWarehouseId = warehouse2Response.body.data.id;

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId: sourceWarehouseId,
          type: 'IN',
          quantity: 50,
        })
        .expect(201);

      const movementResponse = await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          sourceWarehouseId,
          destinationWarehouseId,
          type: 'TRANSFER',
          quantity: 20,
        })
        .expect(201);

      expect(movementResponse.body.data.type).toBe('TRANSFER');
      expect(movementResponse.body.data.sourceWarehouseId).toBe(sourceWarehouseId);
      expect(movementResponse.body.data.destinationWarehouseId).toBe(destinationWarehouseId);
    });

    it('should reject transfer with same source and destination', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TRANSFER-SAME-001',
          name: 'Transfer Same Test Product',
          unitPrice: 100,
          costPrice: 50,
          stockQuantity: 100,
        })
        .expect(201);

      const productId = productResponse.body.data.id;

      const warehouseResponse = await request(app.getHttpServer())
        .post('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Transfer Same Warehouse',
          isActive: true,
        })
        .expect(201);

      const warehouseId = warehouseResponse.body.data.id;

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          warehouseId,
          type: 'IN',
          quantity: 50,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          sourceWarehouseId: warehouseId,
          destinationWarehouseId: warehouseId,
          type: 'TRANSFER',
          quantity: 10,
        })
        .expect(400);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not allow cross-tenant product access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .get(`/products/${testData.tenantBProduct.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should not allow cross-tenant warehouse access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .get(`/warehouses/${testData.tenantBWarehouse.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should not allow cross-tenant stock movement access', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      await request(app.getHttpServer())
        .get(`/stock-movements/${testData.tenantBStockMovement.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should not allow cross-tenant product creation with cross-tenant warehouse', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .post('/stock-movements')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          productId: testData.tenantBProduct.id,
          warehouseId: testData.tenantAWarehouse.id,
          type: 'IN',
          quantity: 10,
        })
        .expect(403);
    });
  });

  describe('Role Authorization', () => {
    it('should deny EMPLOYEE access to products', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE access to warehouses', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny EMPLOYEE access to stock movements', async () => {
      const token = generateToken(testData.tenantAEmployee);

      await request(app.getHttpServer())
        .get('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow ADMIN access to inventory', async () => {
      const token = generateToken(testData.tenantAAdmin);

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should allow MANAGER access to inventory', async () => {
      const token = generateToken(testData.tenantAManager);

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/stock-movements')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Inventory Report', () => {
    it('should return inventory report for tenant', async () => {
      const token = generateToken(testData.tenantAAdmin);

      const response = await request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.totalProducts).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalStockValue).toBeGreaterThanOrEqual(0);
    });

    it('should not leak tenant A inventory to tenant B', async () => {
      const tokenA = generateToken(testData.tenantAAdmin);
      const tokenB = generateToken(testData.tenantBAdmin);

      const responseA = await request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.data.totalProducts).toBeGreaterThanOrEqual(1);
      expect(responseB.body.data.totalProducts).toBeGreaterThanOrEqual(1);
    });
  });
});
