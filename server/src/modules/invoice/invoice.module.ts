import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { GlModule } from '../gl/gl.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [PrismaModule, ActivityLogsModule, GlModule, SubscriptionsModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
