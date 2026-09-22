-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "payrollId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_payrollId_key" ON "Payment"("payrollId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
