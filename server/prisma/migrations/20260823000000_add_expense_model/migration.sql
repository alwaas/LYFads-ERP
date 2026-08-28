CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expenseDate" TIMESTAMP NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNo" TEXT,
    "notes" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expenses_expenseDate_tenantId_idx" ON "expenses"("expenseDate", "tenantId");
CREATE INDEX "expenses_category_tenantId_idx" ON "expenses"("category", "tenantId");
CREATE INDEX "expenses_tenantId_idx" ON "expenses"("tenantId");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
