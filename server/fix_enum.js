const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Step 1: Create new enum type
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceStatus_new') THEN
          CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');
        END IF;
      END $$;
    `;
    console.log('Created InvoiceStatus_new enum');

    // Step 2: Drop default on status column
    await prisma.$executeRaw`ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT`;
    console.log('Dropped default on status');

    // Step 3: Alter column type
    await prisma.$executeRaw`
      ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" 
      USING ("status"::text::"InvoiceStatus_new")
    `;
    console.log('Altered status column type');

    // Step 4: Rename old enum
    await prisma.$executeRaw`ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old"`;
    console.log('Renamed old enum');

    // Step 5: Rename new enum
    await prisma.$executeRaw`ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus"`;
    console.log('Renamed new enum');

    // Step 6: Drop old enum
    await prisma.$executeRaw`DROP TYPE "InvoiceStatus_old"`;
    console.log('Dropped old enum');

    // Step 7: Add default back
    await prisma.$executeRaw`ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`;
    console.log('Set default back');

    // Verify
    const values = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'InvoiceStatus') ORDER BY enumsortorder
    `;
    console.log('New InvoiceStatus VALUES:', values);
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
