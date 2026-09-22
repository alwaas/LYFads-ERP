-- Reporting performance indexes
-- These indexes support the new Reports & Analytics module queries

-- Invoice date-range queries for sales reports
CREATE INDEX "Invoice_tenantId_issueDate_idx" ON "public"."Invoice"("tenantId", "issueDate");

-- Invoice due-date queries for aging/overdue reports
CREATE INDEX "Invoice_tenantId_dueDate_idx" ON "public"."Invoice"("tenantId", "dueDate");

-- Invoice status + date queries for filtered financial reports
CREATE INDEX "Invoice_tenantId_status_issueDate_idx" ON "public"."Invoice"("tenantId", "status", "issueDate");

-- Payment date-range queries for cash flow reports
CREATE INDEX "Payment_tenantId_paymentDate_idx" ON "public"."Payment"("tenantId", "paymentDate");

-- Payment tenant-scoped queries
CREATE INDEX "Payment_tenantId_invoiceId_idx" ON "public"."Payment"("tenantId", "invoiceId");

-- Client-linked invoice queries for customer reports
CREATE INDEX "Invoice_tenantId_clientId_idx" ON "public"."Invoice"("tenantId", "clientId");

-- Project-linked invoice queries
CREATE INDEX "Invoice_tenantId_projectId_idx" ON "public"."Invoice"("tenantId", "projectId");
