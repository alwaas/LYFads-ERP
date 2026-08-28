-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('ACTIVE', 'VOIDED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "status" "PaymentStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "voidedById" TEXT;

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_invoiceId_key" ON "PaymentAllocation"("paymentId", "invoiceId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_tenantId_idx" ON "PaymentAllocation"("paymentId", "tenantId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_tenantId_idx" ON "PaymentAllocation"("invoiceId", "tenantId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_tenantId_idx" ON "PaymentAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_status_tenantId_idx" ON "Payment"("status", "tenantId");

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
