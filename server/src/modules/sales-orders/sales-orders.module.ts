import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
