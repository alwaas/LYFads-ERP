CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP NOT NULL,
    "vendor" TEXT NOT NULL,
    "referenceNo" TEXT,
    "description" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchases_purchaseDate_tenantId_idx" ON "purchases"("purchaseDate", "tenantId");
CREATE INDEX "purchases_vendor_tenantId_idx" ON "purchases"("vendor", "tenantId");
CREATE INDEX "purchases_tenantId_idx" ON "purchases"("tenantId");

ALTER TABLE "purchases" ADD CONSTRAINT "purchases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
