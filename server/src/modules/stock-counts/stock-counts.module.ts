import { Module } from '@nestjs/common';
import { StockCountsService } from './stock-counts.service';
import { StockCountsController } from './stock-counts.controller';
import { InventoryValuationModule } from '../inventory-valuation/inventory-valuation.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [InventoryValuationModule, ActivityLogsModule],
  providers: [StockCountsService],
  controllers: [StockCountsController],
  exports: [StockCountsService],
})
export class StockCountsModule {}
