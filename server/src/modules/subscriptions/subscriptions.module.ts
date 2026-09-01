import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { PlansModule } from '../plans/plans.module';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { EntitlementService } from './entitlement.service';
import { UsageService } from './usage.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, PlansModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, EntitlementService, UsageService],
  exports: [SubscriptionsService, EntitlementService, UsageService],
})
export class SubscriptionsModule {}
