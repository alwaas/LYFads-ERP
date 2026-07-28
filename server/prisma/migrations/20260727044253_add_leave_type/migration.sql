-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('CASUAL', 'SICK', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY');

-- AlterTable
ALTER TABLE "public"."leaves" ADD COLUMN     "leaveType" "public"."LeaveType" NOT NULL DEFAULT 'CASUAL';
