import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { GlModule } from '../gl/gl.module';
import { PaymentsModule } from '../payments/payments.module';

import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollCalculationService } from './payroll-calculation.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, GlModule, PaymentsModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollCalculationService],
  exports: [PayrollService],
})
export class PayrollModule {}
