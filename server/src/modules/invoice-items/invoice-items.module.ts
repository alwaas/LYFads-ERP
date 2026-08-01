import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

import { InvoiceItemsController } from './invoice-items.controller';
import { InvoiceItemsService } from './invoice-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceItemsController],
  providers: [InvoiceItemsService],
  exports: [InvoiceItemsService],
})
export class InvoiceItemsModule {}