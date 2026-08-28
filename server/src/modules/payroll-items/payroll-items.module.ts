import { Module } from '@nestjs/common';
import { PayrollItemsService } from './payroll-items.service';
import { PayrollItemsController } from './payroll-items.controller';

@Module({
  controllers: [PayrollItemsController],
  providers: [PayrollItemsService],
  exports: [PayrollItemsService],
})
export class PayrollItemsModule {}
