-- Accounts Payable: Vendor Bills (PurchaseInvoice) + polymorphic Payment / PaymentAllocation
-- Additive & non-destructive. Existing AR (customer) payment flows are unchanged:
-- AR rows keep invoiceId populated; vendor rows populate purchaseInvoiceId.

-- 1. New status enum for vendor bills
CREATE TYPE "public"."PurchaseInvoiceStatus" AS ENUM (
    'DRAFT',
    'APPROVED',
    'POSTED',
    'PARTIALLY_PAID',
    'PAID',
    'VOIDED',
    'CANCELLED'
);

-- 2. New table: purchase_invoices (vendor bills)
CREATE TABLE "public"."purchase_invoices" (
    "id"                TEXT                   NOT NULL,
    "invoiceNumber"     TEXT                   NOT NULL,
    "vendorId"          TEXT                   NOT NULL,
    "purchaseOrderId"   TEXT,
    "issueDate"         TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate"           TIMESTAMP(3)           NOT NULL,
    "status"            "public"."PurchaseInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal"          DECIMAL(12,2)          NOT NULL,
    "tax"               DECIMAL(12,2)          NOT NULL DEFAULT 0,
    "discount"          DECIMAL(12,2)          NOT NULL DEFAULT 0,
    "total"             DECIMAL(12,2)          NOT NULL,
    "amountPaid"        DECIMAL(12,2)          NOT NULL DEFAULT 0,
    "balanceAmount"     DECIMAL(12,2)          NOT NULL,
    "notes"             TEXT,
    "tenantId"          TEXT                   NOT NULL,
    "createdAt"         TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)           NOT NULL,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- 3. New table: purchase_invoice_items (vendor bill line items)
CREATE TABLE "public"."purchase_invoice_items" (
    "id"                TEXT          NOT NULL,
    "purchaseInvoiceId" TEXT          NOT NULL,
    "description"       TEXT          NOT NULL,
    "quantity"          DECIMAL(12,2) NOT NULL,
    "unitCost"          DECIMAL(12,2) NOT NULL,
    "tax"               DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount"          DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal"         DECIMAL(12,2) NOT NULL,
    "sequence"          INTEGER       NOT NULL DEFAULT 0,
    "createdAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId"          TEXT          NOT NULL,

    CONSTRAINT "purchase_invoice_items_pkey" PRIMARY KEY ("id")
);

-- 4. FKs + unique + indexes for purchase_invoices
ALTER TABLE "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_vendor_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "public"."vendors" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_purchaseOrder_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders" ("id") ON DELETE SET NULL;

ALTER TABLE "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_tenant_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "purchase_invoices_invoiceNumber_tenantId_key"
    ON "public"."purchase_invoices" ("invoiceNumber", "tenantId");
CREATE INDEX "purchase_invoices_tenantId_idx"
    ON "public"."purchase_invoices" ("tenantId");
CREATE INDEX "purchase_invoices_vendorId_tenantId_idx"
    ON "public"."purchase_invoices" ("vendorId", "tenantId");
CREATE INDEX "purchase_invoices_purchaseOrderId_tenantId_idx"
    ON "public"."purchase_invoices" ("purchaseOrderId", "tenantId");
CREATE INDEX "purchase_invoices_status_tenantId_idx"
    ON "public"."purchase_invoices" ("status", "tenantId");
CREATE INDEX "purchase_invoices_dueDate_tenantId_idx"
    ON "public"."purchase_invoices" ("dueDate", "tenantId");

-- 5. FKs + indexes for purchase_invoice_items
ALTER TABLE "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_purchaseInvoice_fkey"
    FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices" ("id") ON DELETE CASCADE;

ALTER TABLE "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_tenant_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE;

CREATE INDEX "purchase_invoice_items_purchaseInvoiceId_tenantId_idx"
    ON "public"."purchase_invoice_items" ("purchaseInvoiceId", "tenantId");
CREATE INDEX "purchase_invoice_items_tenantId_idx"
    ON "public"."purchase_invoice_items" ("tenantId");

-- 6. Extend "Payment" to be polymorphic (vendor payments). invoiceId becomes optional.
ALTER TABLE "public"."Payment"
    ALTER COLUMN "invoiceId" DROP NOT NULL;

ALTER TABLE "public"."Payment"
    ADD COLUMN "purchaseInvoiceId" TEXT;

ALTER TABLE "public"."Payment"
    ADD CONSTRAINT "Payment_purchaseInvoice_fkey"
    FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices" ("id") ON DELETE CASCADE;

CREATE INDEX "Payment_purchaseInvoiceId_tenantId_idx"
    ON "public"."Payment" ("purchaseInvoiceId", "tenantId");

-- 7. Extend "PaymentAllocation" to be polymorphic. invoiceId becomes optional.
ALTER TABLE "public"."PaymentAllocation"
    ALTER COLUMN "invoiceId" DROP NOT NULL;

ALTER TABLE "public"."PaymentAllocation"
    ADD COLUMN "purchaseInvoiceId" TEXT;

ALTER TABLE "public"."PaymentAllocation"
    ADD CONSTRAINT "PaymentAllocation_purchaseInvoice_fkey"
    FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices" ("id") ON DELETE CASCADE;

-- AR dedup (existing index on paymentId, invoiceId) is preserved.
-- AP dedup: each payment may allocate to a given vendor bill at most once.
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_purchaseInvoiceId_key"
    ON "public"."PaymentAllocation" ("paymentId", "purchaseInvoiceId");

CREATE INDEX "PaymentAllocation_purchaseInvoiceId_tenantId_idx"
    ON "public"."PaymentAllocation" ("purchaseInvoiceId", "tenantId");

-- 8. Inverse relations on Vendor / PurchaseOrder / Tenant are datamodel-only; no DDL required.
