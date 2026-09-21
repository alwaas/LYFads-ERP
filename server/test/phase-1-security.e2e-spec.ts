import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';
import * as bcrypt from 'bcrypt';

describe('Phase 1 Security & Authorization E2E Tests', () => {
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

  const generateToken = (user: any) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      fullName: user.fullName,
    });
  };

  describe('UsersController Role Hardening', () => {
    let employeeUser: any;
    let targetUser: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      employeeUser = await prisma.user.create({
        data: {
          email: `employee-${Date.now()}@tenanta.com`,
          fullName: 'Regular Employee',
          password: hashedPassword,
          role: 'EMPLOYEE',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });

      targetUser = await prisma.user.create({
        data: {
          email: `target-${Date.now()}@tenanta.com`,
          fullName: 'Target User',
          password: hashedPassword,
          role: 'EMPLOYEE',
          isActive: true,
          tenantId: testData.tenantA.id,
        },
      });
    });

    it('EMPLOYEE must not be able to create users (403)', async () => {
      const token = generateToken(employeeUser);

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `new-${Date.now()}@tenanta.com`,
          fullName: 'New Person',
          password: 'Password123!',
          role: 'EMPLOYEE',
        })
        .expect(403);
    });

    it('EMPLOYEE must not be able to update user roles (403)', async () => {
      const token = generateToken(employeeUser);

      await request(app.getHttpServer())
        .patch(`/users/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' })
        .expect(403);
    });

    it('EMPLOYEE must not be able to update user status (403)', async () => {
      const token = generateToken(employeeUser);

      await request(app.getHttpServer())
        .patch(`/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false })
        .expect(403);
    });

    it('EMPLOYEE must not be able to delete users (403)', async () => {
      const token = generateToken(employeeUser);

      await request(app.getHttpServer())
        .delete(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('ADMIN must not be able to create or promote to SUPER_ADMIN (403)', async () => {
      const adminToken = generateToken(testData.tenantAAdmin);

      // Try creating SUPER_ADMIN
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `super-${Date.now()}@tenanta.com`,
          fullName: 'Fake Super',
          password: 'Password123!',
          role: 'SUPER_ADMIN',
        })
        .expect(403);

      // Try promoting to SUPER_ADMIN
      await request(app.getHttpServer())
        .patch(`/users/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPER_ADMIN' })
        .expect(403);
    });
  });

  describe('Inactive User & Suspended Tenant Access Rejection', () => {
    it('Inactive user cannot log in (401)', async () => {
      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      const email = `inactive-${Date.now()}@tenanta.com`;
      await prisma.user.create({
        data: {
          email,
          fullName: 'Deactivated User',
          password: hashedPassword,
          role: 'EMPLOYEE',
          isActive: false,
          tenantId: testData.tenantA.id,
        },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'Secret123!',
        })
        .expect(401);
    });

    it('Inactive user cannot access protected endpoints with valid JWT (403)', async () => {
      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      const email = `inactive-jwt-${Date.now()}@tenanta.com`;
      const inactiveUser = await prisma.user.create({
        data: {
          email,
          fullName: 'Deactivated User',
          password: hashedPassword,
          role: 'EMPLOYEE',
          isActive: false,
          tenantId: testData.tenantA.id,
        },
      });

      const token = generateToken(inactiveUser);

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('User belonging to SUSPENDED tenant cannot log in (403)', async () => {
      const suspendedTenant = await prisma.tenant.create({
        data: {
          name: 'Suspended Corp',
          slug: `suspended-corp-${Date.now()}`,
          status: 'SUSPENDED',
        },
      });

      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      const email = `user-${Date.now()}@suspended.com`;
      await prisma.user.create({
        data: {
          email,
          fullName: 'Suspended Tenant User',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          tenantId: suspendedTenant.id,
        },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'Secret123!',
        })
        .expect(403);
    });

    it('User belonging to SUSPENDED tenant cannot access protected endpoints with valid JWT (403)', async () => {
      const suspendedTenant = await prisma.tenant.create({
        data: {
          name: 'Suspended Corp 2',
          slug: `suspended-corp-2-${Date.now()}`,
          status: 'SUSPENDED',
        },
      });

      const hashedPassword = await bcrypt.hash('Secret123!', 10);
      const email = `user-jwt-${Date.now()}@suspended2.com`;
      const user = await prisma.user.create({
        data: {
          email,
          fullName: 'Suspended Tenant User',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          tenantId: suspendedTenant.id,
        },
      });

      const token = generateToken(user);

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
