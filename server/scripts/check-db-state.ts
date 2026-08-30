import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('=== CHECKING DATABASE STATE ===\n');

  // Check for orphaned invoices
  const orphanedInvoices = await prisma.$queryRaw`
    SELECT i.id, i.invoiceNumber, i.clientId
    FROM invoices i
    LEFT JOIN clients c ON i.clientId = c.id
    WHERE i.clientId IS NOT NULL AND c.id IS NULL
  `;

  console.log('Orphaned invoices (clientId not in clients table):');
  console.log(orphanedInvoices);

  // Check for orphaned payments
  const orphanedPayments = await prisma.$queryRaw`
    SELECT p.id, p.invoiceId
    FROM payments p
    LEFT JOIN invoices i ON p.invoiceId = i.id
    WHERE p.invoiceId IS NOT NULL AND i.id IS NULL
  `;

  console.log('\nOrphaned payments (invoiceId not in invoices table):');
  console.log(orphanedPayments);

  // Check payment count
  const paymentCount = await prisma.payment.count();
  console.log(`\nTotal payments: ${paymentCount}`);

  // Check invoice count
  const invoiceCount = await prisma.invoice.count();
  console.log(`Total invoices: ${invoiceCount}`);

  // Check client count
  const clientCount = await prisma.client.count();
  console.log(`Total clients: ${clientCount}`);

  await prisma.$disconnect();
}

checkDatabaseState().catch(console.error);
