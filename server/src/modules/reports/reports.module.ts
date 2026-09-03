import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsExportController } from './reports-export.controller';
import { ReportsExportService } from './reports-export.service';
import { InventoryValuationModule } from '../inventory-valuation/inventory-valuation.module';

@Module({
  imports: [PrismaModule, InventoryValuationModule],
  controllers: [ReportsController, ReportsExportController],
  providers: [ReportsService, ReportsExportService],
  exports: [ReportsService, ReportsExportService],
})
export class ReportsModule {}