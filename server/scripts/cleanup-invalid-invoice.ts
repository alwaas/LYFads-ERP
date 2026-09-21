import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupInvalidInvoice() {
  console.log('=== CLEANING UP INVALID INVOICE ===\n');

  // Delete the invoice with invalid clientId
  const result = await prisma.invoice.deleteMany({
    where: {
      clientId: 'test-client'
    }
  });

  console.log(`Deleted ${result.count} invalid invoices`);

  await prisma.$disconnect();
}

cleanupInvalidInvoice().catch(console.error);
