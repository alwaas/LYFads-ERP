-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "public"."TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PayrollItemType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "public"."EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- AlterEnum
ALTER TYPE "public"."FiscalPeriodStatus" ADD VALUE 'LOCKED';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PayrollStatus_new" AS ENUM ('PENDING', 'PROCESSED', 'APPROVED', 'PAID');
ALTER TABLE "public"."Payroll" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Payroll" ALTER COLUMN "status" TYPE "public"."PayrollStatus_new" USING ("status"::text::"public"."PayrollStatus_new");
ALTER TYPE "public"."PayrollStatus" RENAME TO "PayrollStatus_old";
ALTER TYPE "public"."PayrollStatus_new" RENAME TO "PayrollStatus";
DROP TYPE "public"."PayrollStatus_old";
ALTER TABLE "public"."Payroll" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_purchaseInvoice_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_purchaseInvoice_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_account_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_invoice_items" DROP CONSTRAINT "purchase_invoice_items_purchaseInvoice_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_invoice_items" DROP CONSTRAINT "purchase_invoice_items_tenant_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_invoices" DROP CONSTRAINT "purchase_invoices_purchaseOrder_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_invoices" DROP CONSTRAINT "purchase_invoices_tenant_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_invoices" DROP CONSTRAINT "purchase_invoices_vendor_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchases" DROP CONSTRAINT "purchases_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_destinationWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_sourceWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_warehouseId_fkey";

-- DropIndex
DROP INDEX "public"."Invoice_tenantId_clientId_idx";

-- DropIndex
DROP INDEX "public"."Invoice_tenantId_dueDate_idx";

-- DropIndex
DROP INDEX "public"."Invoice_tenantId_issueDate_idx";

-- DropIndex
DROP INDEX "public"."Invoice_tenantId_projectId_idx";

-- DropIndex
DROP INDEX "public"."Invoice_tenantId_status_issueDate_idx";

-- DropIndex
DROP INDEX "public"."Payment_tenantId_invoiceId_idx";

-- DropIndex
DROP INDEX "public"."Payment_tenantId_paymentDate_idx";

-- DropIndex
DROP INDEX "public"."journal_entries_tenantId_idx";

-- DropIndex
DROP INDEX "public"."projects_projectCode_key";

-- DropIndex
DROP INDEX "public"."tasks_taskCode_key";

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "expenseId" TEXT;

-- AlterTable
ALTER TABLE "public"."PaymentAllocation" ADD COLUMN     "expenseId" TEXT;

-- AlterTable
ALTER TABLE "public"."Payroll" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "public"."Timesheet" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "public"."TimesheetStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."attendance" DROP COLUMN "status",
ADD COLUMN     "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT';

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "status" "public"."EmploymentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."expenses" ALTER COLUMN "expenseDate" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "approvedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "paidAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."fifo_cost_layers" ALTER COLUMN "receivedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."fiscal_years" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."journal_entries" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."leaves" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "public"."product_warehouses" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "unitPrice" DROP DEFAULT,
ALTER COLUMN "costPrice" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."purchases" ALTER COLUMN "purchaseDate" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."stock_count_lines" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."stock_counts" ALTER COLUMN "countDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "approvedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."stock_movements" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."vendors" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."warehouses" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."leave_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_structures" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incentives" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_items" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "type" "public"."PayrollItemType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_tenantId_idx" ON "public"."leave_balances"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "leave_balances_tenantId_idx" ON "public"."leave_balances"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveType_year_tenantId_key" ON "public"."leave_balances"("employeeId", "leaveType", "year", "tenantId");

-- CreateIndex
CREATE INDEX "salary_structures_employeeId_tenantId_idx" ON "public"."salary_structures"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "salary_structures_tenantId_idx" ON "public"."salary_structures"("tenantId");

-- CreateIndex
CREATE INDEX "salary_structures_isActive_tenantId_idx" ON "public"."salary_structures"("isActive", "tenantId");

-- CreateIndex
CREATE INDEX "payroll_items_payrollId_tenantId_idx" ON "public"."payroll_items"("payrollId", "tenantId");

-- CreateIndex
CREATE INDEX "payroll_items_tenantId_idx" ON "public"."payroll_items"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_expenseId_tenantId_idx" ON "public"."Payment"("expenseId", "tenantId");

-- CreateIndex
CREATE INDEX "Payment_payrollId_tenantId_idx" ON "public"."Payment"("payrollId", "tenantId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_expenseId_tenantId_idx" ON "public"."PaymentAllocation"("expenseId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_expenseId_key" ON "public"."PaymentAllocation"("paymentId", "expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectCode_tenantId_key" ON "public"."projects"("projectCode", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskCode_tenantId_key" ON "public"."tasks"("taskCode", "tenantId");

-- RenameForeignKey
ALTER TABLE "public"."accounts" RENAME CONSTRAINT "accounts_tenant_fkey" TO "accounts_tenantId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."fiscal_years" RENAME CONSTRAINT "fiscal_years_tenant_fkey" TO "fiscal_years_tenantId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."journal_entries" RENAME CONSTRAINT "journal_entries_createdBy_fkey" TO "journal_entries_createdById_fkey";

-- RenameForeignKey
ALTER TABLE "public"."journal_entries" RENAME CONSTRAINT "journal_entries_fiscalYear_fkey" TO "journal_entries_fiscalYearId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."journal_entries" RENAME CONSTRAINT "journal_entries_tenant_fkey" TO "journal_entries_tenantId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."journal_entry_lines" RENAME CONSTRAINT "journal_entry_lines_journalEntry_fkey" TO "journal_entry_lines_journalEntryId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."journal_entry_lines" RENAME CONSTRAINT "journal_entry_lines_tenant_fkey" TO "journal_entry_lines_tenantId_fkey";

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaves" ADD CONSTRAINT "leaves_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_balances" ADD CONSTRAINT "leave_balances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Timesheet" ADD CONSTRAINT "Timesheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payroll" ADD CONSTRAINT "Payroll_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_structures" ADD CONSTRAINT "salary_structures_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_structures" ADD CONSTRAINT "salary_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "public"."Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_invoices" ADD CONSTRAINT "purchase_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "public"."purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."fifo_cost_layers_tenantId_productWarehouseId_remainingQuantity_" RENAME TO "fifo_cost_layers_tenantId_productWarehouseId_remainingQuant_idx";

