import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { PlansModule } from '../plans/plans.module';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { EntitlementService } from './entitlement.service';
import { UsageService } from './usage.service';
import { FeatureGuard } from './guards/feature.guard';

@Module({
  imports: [PrismaModule, ActivityLogsModule, PlansModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, EntitlementService, UsageService, FeatureGuard],
  exports: [SubscriptionsService, EntitlementService, UsageService, FeatureGuard],
})
export class SubscriptionsModule {}
