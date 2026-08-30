CREATE TYPE InvoiceStatus AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

CREATE TABLE invoices (
    id TEXT NOT NULL,
    tenantId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    projectId TEXT,
    salesOrderId TEXT,
    invoiceNumber TEXT NOT NULL,
    issueDate TIMESTAMP(3) NOT NULL,
    dueDate TIMESTAMP(3) NOT NULL,
    status InvoiceStatus NOT NULL DEFAULT 'DRAFT',
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    paidAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
    balanceAmount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    createdById TEXT,
    issuedAt TIMESTAMP(3),
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE invoice_items (
    id TEXT NOT NULL,
    invoiceId TEXT NOT NULL,
    salesOrderItemId TEXT,
    productId TEXT,
    description TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unitPrice DECIMAL(12,2) NOT NULL,
    taxRate DECIMAL(5,2),
    taxAmount DECIMAL(12,2),
    discount DECIMAL(12,2),
    lineTotal DECIMAL(12,2) NOT NULL,
    tenantId TEXT NOT NULL,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX invoices_invoiceNumber_tenantId_key ON invoices(invoiceNumber, tenantId);
CREATE INDEX invoices_clientId_idx ON invoices(clientId);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX invoices_salesOrderId_idx ON invoices(salesOrderId);
CREATE INDEX invoices_tenantId_idx ON invoices(tenantId);
CREATE INDEX invoice_items_invoiceId_tenantId_idx ON invoice_items(invoiceId, tenantId);
CREATE INDEX invoice_items_tenantId_idx ON invoice_items(tenantId);

ALTER TABLE invoices ADD CONSTRAINT invoices_clientId_fkey FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT invoices_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT invoices_salesOrderId_fkey FOREIGN KEY (salesOrderId) REFERENCES sales_orders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT invoices_createdById_fkey FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD CONSTRAINT invoices_tenantId_fkey FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_invoiceId_fkey FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_salesOrderItemId_fkey FOREIGN KEY (salesOrderItemId) REFERENCES sales_order_items(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_productId_fkey FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_tenantId_fkey FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT payments_invoiceId_fkey FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE;
