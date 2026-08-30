import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInvoiceClientFK() {
  console.log('=== CHECKING INVOICE CLIENT FOREIGN KEY ISSUE ===\n');

  // Check for invoices with invalid clientIds
  const invalidInvoices = await prisma.$queryRaw`
    SELECT i.id, i."invoiceNumber", i."clientId"
    FROM invoices i
    LEFT JOIN clients c ON i."clientId" = c.id
    WHERE i."clientId" IS NOT NULL AND c.id IS NULL
  `;

  console.log('Invoices with invalid clientId:');
  console.log(invalidInvoices);

  // Check total invoices
  const totalInvoices = await prisma.invoice.count();
  console.log(`\nTotal invoices: ${totalInvoices}`);

  // Check total clients
  const totalClients = await prisma.client.count();
  console.log(`Total clients: ${totalClients}`);

  // Sample some invoice clientIds
  const sampleInvoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      clientId: true,
    },
    take: 5,
  });

  console.log('\nSample invoices:');
  console.log(sampleInvoices);

  // Sample some client IDs
  const sampleClients = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
    },
    take: 5,
  });

  console.log('\nSample clients:');
  console.log(sampleClients);

  await prisma.$disconnect();
}

checkInvoiceClientFK().catch(console.error);
