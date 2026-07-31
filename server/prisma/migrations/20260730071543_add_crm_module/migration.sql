-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'REFERRAL', 'WHATSAPP', 'OTHER');

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "public"."LeadSource" NOT NULL DEFAULT 'OTHER',
    "estimatedValue" DECIMAL(12,2),
    "remarks" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follow_ups" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "nextFollowUp" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_ups" ADD CONSTRAINT "follow_ups_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
