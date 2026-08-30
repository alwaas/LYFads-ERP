CREATE TABLE IF NOT EXISTS "invoices" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "projectId" TEXT,
  "salesOrderId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(12,2) NOT NULL,
  "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "balanceAmount" DECIMAL(12,2) NOT NULL,
  "notes" TEXT,
  "createdById" TEXT,
  "issuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "salesOrderItemId" TEXT,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(8,2) NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "taxRate" DECIMAL(5,2),
  "taxAmount" DECIMAL(12,2),
  "discount" DECIMAL(12,2),
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_tenantId_key" ON "invoices"("invoiceNumber", "tenantId");
CREATE INDEX IF NOT EXISTS "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_salesOrderId_idx" ON "invoices"("salesOrderId");
CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON "invoices"("tenantId");
CREATE INDEX IF NOT EXISTS "invoice_items_invoiceId_tenantId_idx" ON "invoice_items"("invoiceId", "tenantId");
CREATE INDEX IF NOT EXISTS "invoice_items_tenantId_idx" ON "invoice_items"("tenantId");
