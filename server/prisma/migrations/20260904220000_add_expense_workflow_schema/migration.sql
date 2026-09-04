-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED', 'PAID', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "expenses" ADD COLUMN "total" DECIMAL(12,2);
ALTER TABLE "expenses" ADD COLUMN "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "expenses" ADD COLUMN "receiptUrl" TEXT;
ALTER TABLE "expenses" ADD COLUMN "vendorId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "glAccountId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "createdById" TEXT;
ALTER TABLE "expenses" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "expenses" ADD COLUMN "approvedAt" TIMESTAMP;
ALTER TABLE "expenses" ADD COLUMN "paidAt" TIMESTAMP;
ALTER TABLE "expenses" ADD COLUMN "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "expenses" ADD COLUMN "balanceAmount" DECIMAL(12,2);

-- Backfill existing expense rows so total/balanceAmount are never null for pre-existing data
UPDATE "expenses"
   SET "total" = "amount",
       "balanceAmount" = "amount"
 WHERE "total" IS NULL;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "expenses_status_tenantId_idx" ON "expenses"("status", "tenantId");
CREATE INDEX "expenses_vendorId_tenantId_idx" ON "expenses"("vendorId", "tenantId");
CREATE INDEX "expenses_employeeId_tenantId_idx" ON "expenses"("employeeId", "tenantId");
CREATE INDEX "expenses_createdById_tenantId_idx" ON "expenses"("createdById", "tenantId");
