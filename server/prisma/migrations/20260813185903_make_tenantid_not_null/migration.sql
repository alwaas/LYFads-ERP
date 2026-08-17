/*
  Warnings:

  - Made the column `tenantId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `leads` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_tenantId_fkey";

-- AlterTable
ALTER TABLE "public"."Invoice" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."leads" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "tenantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
