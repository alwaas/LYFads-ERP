-- Add tenant settings fields for company profile configuration

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';
