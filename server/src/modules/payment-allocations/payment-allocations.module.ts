import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { PaymentAllocationsController } from './payment-allocations.controller';
import { PaymentAllocationsService } from './payment-allocations.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [PaymentAllocationsController],
  providers: [PaymentAllocationsService],
  exports: [PaymentAllocationsService],
})
export class PaymentAllocationsModule {}
