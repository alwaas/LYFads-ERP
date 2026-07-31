import { Module } from '@nestjs/common';

import { DailyWorkReportsController } from './daily-work-reports.controller';
import { DailyWorkReportsService } from './daily-work-reports.service';

@Module({
  controllers: [DailyWorkReportsController],
  providers: [DailyWorkReportsService],
})
export class DailyWorkReportsModule {}
