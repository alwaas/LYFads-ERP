import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { DailyWorkReportsController } from './daily-work-reports.controller';
import { DailyWorkReportsService } from './daily-work-reports.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [DailyWorkReportsController],
  providers: [DailyWorkReportsService],
  exports: [DailyWorkReportsService],
})
export class DailyWorkReportsModule {}
