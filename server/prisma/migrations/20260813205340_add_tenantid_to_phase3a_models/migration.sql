-- DropIndex
DROP INDEX "public"."Milestone_projectId_idx";

-- DropIndex
DROP INDEX "public"."Payment_invoiceId_idx";

-- DropIndex
DROP INDEX "public"."Payroll_employeeId_idx";

-- DropIndex
DROP INDEX "public"."Payroll_employeeId_month_year_key";

-- DropIndex
DROP INDEX "public"."Payroll_month_idx";

-- DropIndex
DROP INDEX "public"."Payroll_year_idx";

-- DropIndex
DROP INDEX "public"."Timesheet_employeeId_idx";

-- DropIndex
DROP INDEX "public"."Timesheet_workDate_idx";

-- DropIndex
DROP INDEX "public"."activity_logs_action_idx";

-- DropIndex
DROP INDEX "public"."activity_logs_module_idx";

-- DropIndex
DROP INDEX "public"."activity_logs_userId_idx";

-- DropIndex
DROP INDEX "public"."attendance_date_idx";

-- DropIndex
DROP INDEX "public"."attendance_employeeId_idx";

-- DropIndex
DROP INDEX "public"."daily_work_reports_employeeId_idx";

-- DropIndex
DROP INDEX "public"."daily_work_reports_reportDate_idx";

-- DropIndex
DROP INDEX "public"."daily_work_reports_status_idx";

-- DropIndex
DROP INDEX "public"."leaves_employeeId_idx";

-- DropIndex
DROP INDEX "public"."leaves_status_idx";

-- DropIndex
DROP INDEX "public"."notifications_isRead_idx";

-- DropIndex
DROP INDEX "public"."notifications_userId_idx";

-- AlterTable
ALTER TABLE "public"."Attachment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."Comment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."InvoiceItem" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."Milestone" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."Payroll" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."Timesheet" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."activity_logs" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."attendance" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."daily_work_reports" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."follow_ups" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."leaves" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_uploadedBy_tenantId_idx" ON "public"."Attachment"("uploadedBy", "tenantId");

-- CreateIndex
CREATE INDEX "Attachment_projectId_tenantId_idx" ON "public"."Attachment"("projectId", "tenantId");

-- CreateIndex
CREATE INDEX "Attachment_taskId_tenantId_idx" ON "public"."Attachment"("taskId", "tenantId");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_idx" ON "public"."Attachment"("tenantId");

-- CreateIndex
CREATE INDEX "Comment_userId_tenantId_idx" ON "public"."Comment"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "Comment_projectId_tenantId_idx" ON "public"."Comment"("projectId", "tenantId");

-- CreateIndex
CREATE INDEX "Comment_taskId_tenantId_idx" ON "public"."Comment"("taskId", "tenantId");

-- CreateIndex
CREATE INDEX "Comment_tenantId_idx" ON "public"."Comment"("tenantId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_tenantId_idx" ON "public"."InvoiceItem"("invoiceId", "tenantId");

-- CreateIndex
CREATE INDEX "InvoiceItem_tenantId_idx" ON "public"."InvoiceItem"("tenantId");

-- CreateIndex
CREATE INDEX "Milestone_projectId_tenantId_idx" ON "public"."Milestone"("projectId", "tenantId");

-- CreateIndex
CREATE INDEX "Milestone_tenantId_idx" ON "public"."Milestone"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_tenantId_idx" ON "public"."Payment"("invoiceId", "tenantId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_tenantId_idx" ON "public"."Payment"("paymentDate", "tenantId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "public"."Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Payroll_employeeId_tenantId_idx" ON "public"."Payroll"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "Payroll_month_year_tenantId_idx" ON "public"."Payroll"("month", "year", "tenantId");

-- CreateIndex
CREATE INDEX "Payroll_tenantId_idx" ON "public"."Payroll"("tenantId");

-- CreateIndex
CREATE INDEX "Timesheet_employeeId_tenantId_idx" ON "public"."Timesheet"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "Timesheet_workDate_tenantId_idx" ON "public"."Timesheet"("workDate", "tenantId");

-- CreateIndex
CREATE INDEX "Timesheet_tenantId_idx" ON "public"."Timesheet"("tenantId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_tenantId_idx" ON "public"."activity_logs"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "activity_logs_module_tenantId_idx" ON "public"."activity_logs"("module", "tenantId");

-- CreateIndex
CREATE INDEX "activity_logs_action_tenantId_idx" ON "public"."activity_logs"("action", "tenantId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_idx" ON "public"."activity_logs"("tenantId");

-- CreateIndex
CREATE INDEX "attendance_employeeId_tenantId_idx" ON "public"."attendance"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "attendance_date_tenantId_idx" ON "public"."attendance"("date", "tenantId");

-- CreateIndex
CREATE INDEX "attendance_tenantId_idx" ON "public"."attendance"("tenantId");

-- CreateIndex
CREATE INDEX "daily_work_reports_employeeId_tenantId_idx" ON "public"."daily_work_reports"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "daily_work_reports_reportDate_tenantId_idx" ON "public"."daily_work_reports"("reportDate", "tenantId");

-- CreateIndex
CREATE INDEX "daily_work_reports_tenantId_idx" ON "public"."daily_work_reports"("tenantId");

-- CreateIndex
CREATE INDEX "employees_userId_tenantId_idx" ON "public"."employees"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "employees_tenantId_idx" ON "public"."employees"("tenantId");

-- CreateIndex
CREATE INDEX "follow_ups_leadId_tenantId_idx" ON "public"."follow_ups"("leadId", "tenantId");

-- CreateIndex
CREATE INDEX "follow_ups_nextFollowUp_tenantId_idx" ON "public"."follow_ups"("nextFollowUp", "tenantId");

-- CreateIndex
CREATE INDEX "follow_ups_tenantId_idx" ON "public"."follow_ups"("tenantId");

-- CreateIndex
CREATE INDEX "leaves_employeeId_tenantId_idx" ON "public"."leaves"("employeeId", "tenantId");

-- CreateIndex
CREATE INDEX "leaves_status_tenantId_idx" ON "public"."leaves"("status", "tenantId");

-- CreateIndex
CREATE INDEX "leaves_tenantId_idx" ON "public"."leaves"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_tenantId_idx" ON "public"."notifications"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "notifications_isRead_tenantId_idx" ON "public"."notifications"("isRead", "tenantId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "public"."notifications"("tenantId");

-- CreateIndex
CREATE INDEX "projects_clientId_tenantId_idx" ON "public"."projects"("clientId", "tenantId");

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "public"."projects"("tenantId");

-- CreateIndex
CREATE INDEX "tasks_projectId_tenantId_idx" ON "public"."tasks"("projectId", "tenantId");

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "public"."tasks"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaves" ADD CONSTRAINT "leaves_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_work_reports" ADD CONSTRAINT "daily_work_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Timesheet" ADD CONSTRAINT "Timesheet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Milestone" ADD CONSTRAINT "Milestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_ups" ADD CONSTRAINT "follow_ups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payroll" ADD CONSTRAINT "Payroll_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
