-- Create vendors table
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "gstNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- Create indexes for vendors
CREATE INDEX "vendors_tenantId_idx" ON "vendors"("tenantId");
CREATE INDEX "vendors_name_tenantId_idx" ON "vendors"("name", "tenantId");
CREATE INDEX "vendors_isActive_tenantId_idx" ON "vendors"("isActive", "tenantId");

-- Add unique constraint for email per tenant (allows multiple NULLs)
CREATE UNIQUE INDEX "vendors_email_tenantId_key" ON "vendors"("email", "tenantId") WHERE "email" IS NOT NULL;

-- Add vendorId column to purchases (nullable initially for backfill)
ALTER TABLE "purchases" ADD COLUMN "vendorId" TEXT;

-- Add foreign key constraint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill vendors from existing purchase vendor strings
INSERT INTO "vendors" ("tenantId", "name", "contactPerson", "email", "phone", "address", "city", "state", "country", "pincode", "gstNumber", "isActive", "notes", "createdAt", "updatedAt")
SELECT DISTINCT 
    "tenantId", 
    CASE WHEN TRIM("vendor") = '' THEN 'Unknown Vendor' ELSE "vendor" END,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NOW(), NOW()
FROM "purchases"
WHERE "vendor" IS NOT NULL;

-- Backfill purchase.vendorId from vendors
UPDATE "purchases" p
SET "vendorId" = v."id"
FROM "vendors" v
WHERE v."tenantId" = p."tenantId"
  AND v."name" = CASE WHEN TRIM(p."vendor") = '' THEN 'Unknown Vendor' ELSE p."vendor" END;

-- Verify all purchases with non-empty vendor have vendorId mapped
DO $$
DECLARE
    unmapped_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmapped_count
    FROM "purchases"
    WHERE ("vendor" IS NOT NULL AND TRIM("vendor") != '')
      AND "vendorId" IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE EXCEPTION 'Data migration safety check failed: % purchases have non-empty vendor strings but null vendorId', unmapped_count;
    END IF;
END $$;

-- Make vendorId required
ALTER TABLE "purchases" ALTER COLUMN "vendorId" SET NOT NULL;

-- Drop old vendor index before dropping vendor column
DROP INDEX IF EXISTS "purchases_vendor_tenantId_idx";

-- Drop legacy vendor column
ALTER TABLE "purchases" DROP COLUMN "vendor";

-- Add vendorId index (already exists implicitly via FK, but add explicit composite index)
CREATE INDEX "purchases_vendorId_tenantId_idx" ON "purchases"("vendorId", "tenantId");
