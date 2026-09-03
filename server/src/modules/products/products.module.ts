import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryValuationModule } from '../inventory-valuation/inventory-valuation.module';

@Module({
  imports: [InventoryValuationModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
