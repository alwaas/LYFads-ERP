import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { InventoryValuationModule } from '../inventory-valuation/inventory-valuation.module';
import { GlModule } from '../gl/gl.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  imports: [
    PrismaModule,
    ActivityLogsModule,
    InventoryValuationModule,
    GlModule,
    SubscriptionsModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
