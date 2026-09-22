import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { TenantManagementController } from './tenant-management.controller';
import { TenantManagementService } from './tenant-management.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, SubscriptionsModule],
  controllers: [TenantManagementController],
  providers: [TenantManagementService],
  exports: [TenantManagementService],
})
export class TenantManagementModule {}
