-- AlterEnum
ALTER TYPE "public"."SalesOrderStatus" ADD VALUE 'INVOICED';

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "salesOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_salesOrderId_idx" ON "public"."Invoice"("salesOrderId");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
