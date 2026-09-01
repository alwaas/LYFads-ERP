import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
