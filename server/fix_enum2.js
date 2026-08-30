const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // The column is already using InvoiceStatus_new from the previous script
    // Now drop the old enum - the column should no longer depend on it
    await prisma.$executeRaw`DROP TYPE "InvoiceStatus_old"`;
    console.log('Dropped old enum');

    // Rename new enum to final name
    await prisma.$executeRaw`ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus"`;
    console.log('Renamed new enum to InvoiceStatus');

    // Add default back
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
