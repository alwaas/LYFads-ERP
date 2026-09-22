import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database';
import { ReportsService } from '../src/modules/reports/reports.service';
import { setupTestDatabase, teardownTestDatabase } from './setup/test-database';

describe('Debug Inventory Report Direct', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let reportsService: ReportsService;
  let testData: {
    tenantA: { id: string };
    tenantAAdmin: { id: string; email: string; role: string; tenantId: string; fullName: string };
    tenantAProduct: { id: string };
    tenantAWarehouse: { id: string };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    reportsService = app.get<ReportsService>(ReportsService);

    testData = await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  }, 60000);

  it('should debug inventory report directly', async () => {
    try {
      const result = await reportsService.getInventoryReport(testData.tenantA.id, {});
      console.log('Direct service result:', JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('Direct service error:', error.message);
      console.error('Stack:', error.stack);
    }
  });
});
