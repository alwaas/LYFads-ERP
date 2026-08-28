import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { PaymentAllocationsController } from './payment-allocations.controller';
import { PaymentAllocationsService } from './payment-allocations.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentAllocationsController],
  providers: [PaymentAllocationsService],
  exports: [PaymentAllocationsService],
})
export class PaymentAllocationsModule {}
