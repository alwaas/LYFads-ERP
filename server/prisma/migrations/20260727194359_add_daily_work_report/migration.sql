-- CreateEnum
CREATE TYPE "public"."WorkStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."daily_work_reports" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "yesterdayWork" TEXT,
    "todayWork" TEXT NOT NULL,
    "tomorrowPlan" TEXT,
    "hoursWorked" DECIMAL(4,2) NOT NULL,
    "status" "public"."WorkStatus" NOT NULL DEFAULT 'COMPLETED',
    "managerRemarks" TEXT,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_work_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_work_reports_employeeId_idx" ON "public"."daily_work_reports"("employeeId");

-- CreateIndex
CREATE INDEX "daily_work_reports_reportDate_idx" ON "public"."daily_work_reports"("reportDate");

-- CreateIndex
CREATE INDEX "daily_work_reports_status_idx" ON "public"."daily_work_reports"("status");

-- AddForeignKey
ALTER TABLE "public"."daily_work_reports" ADD CONSTRAINT "daily_work_reports_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_work_reports" ADD CONSTRAINT "daily_work_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_work_reports" ADD CONSTRAINT "daily_work_reports_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
