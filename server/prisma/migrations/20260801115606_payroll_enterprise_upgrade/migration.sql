/*
  Warnings:

  - A unique constraint covering the columns `[payslipNo]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Payroll" ADD COLUMN     "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "esi" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grossSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "incentives" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "overtimeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payslipNo" TEXT,
ADD COLUMN     "pf" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tds" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "totalHours" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_payslipNo_key" ON "public"."Payroll"("payslipNo");

-- CreateIndex
CREATE INDEX "Payroll_employeeId_idx" ON "public"."Payroll"("employeeId");
