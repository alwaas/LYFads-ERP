-- Inventory Valuation Method
-- Add tenant-level inventoryValuationMethod (defaults to WEIGHTED_AVERAGE)
-- Add FifoCostLayer table for authoritative FIFO costing
-- Add unitCost/totalCost columns to stock_movements for cost capture
-- Add averageCost column to product_warehouses for weighted average snapshots

-- 1) New enum
CREATE TYPE "InventoryValuationMethod" AS ENUM ('FIFO', 'WEIGHTED_AVERAGE');

-- 2) Add tenant-level valuation method
ALTER TABLE "tenants" ADD COLUMN "inventoryValuationMethod" "InventoryValuationMethod" NOT NULL DEFAULT 'WEIGHTED_AVERAGE';

-- 3) Add cost columns to product_warehouses
ALTER TABLE "product_warehouses" ADD COLUMN "averageCost" DECIMAL(12, 4) NOT NULL DEFAULT 0;

-- 4) Add cost columns to stock_movements
ALTER TABLE "stock_movements" ADD COLUMN "unitCost" DECIMAL(12, 4);
ALTER TABLE "stock_movements" ADD COLUMN "totalCost" DECIMAL(14, 4);

-- 5) Create FifoCostLayer table
CREATE TABLE "fifo_cost_layers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productWarehouseId" TEXT NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12, 4) NOT NULL,
    "receivedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceMovementId" TEXT,

    CONSTRAINT "fifo_cost_layers_pkey" PRIMARY KEY ("id")
);

-- 6) Indexes for FifoCostLayer
CREATE INDEX "fifo_cost_layers_tenantId_productId_warehouseId_idx" ON "fifo_cost_layers"("tenantId", "productId", "warehouseId");
CREATE INDEX "fifo_cost_layers_tenantId_productWarehouseId_receivedAt_idx" ON "fifo_cost_layers"("tenantId", "productWarehouseId", "receivedAt");
CREATE INDEX "fifo_cost_layers_tenantId_productWarehouseId_remainingQuantity_idx" ON "fifo_cost_layers"("tenantId", "productWarehouseId", "remainingQuantity");

-- 7) Foreign keys
ALTER TABLE "fifo_cost_layers" ADD CONSTRAINT "fifo_cost_layers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fifo_cost_layers" ADD CONSTRAINT "fifo_cost_layers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fifo_cost_layers" ADD CONSTRAINT "fifo_cost_layers_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fifo_cost_layers" ADD CONSTRAINT "fifo_cost_layers_productWarehouseId_fkey" FOREIGN KEY ("productWarehouseId") REFERENCES "product_warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) Stock counts (physical reconciliation)
CREATE TABLE "stock_counts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "countDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_count_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stockCountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "countedQuantity" INTEGER NOT NULL,
    "systemQuantity" INTEGER,
    "variance" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_count_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_counts_tenantId_warehouseId_idx" ON "stock_counts"("tenantId", "warehouseId");
CREATE INDEX "stock_counts_tenantId_status_idx" ON "stock_counts"("tenantId", "status");
CREATE INDEX "stock_count_lines_tenantId_stockCountId_idx" ON "stock_count_lines"("tenantId", "stockCountId");

ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_stockCountId_fkey" FOREIGN KEY ("stockCountId") REFERENCES "stock_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
