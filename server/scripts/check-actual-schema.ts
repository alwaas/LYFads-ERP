import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkActualSchema() {
  console.log('=== CHECKING ACTUAL DATABASE SCHEMA ===\n');

  // Get actual column names for invoices table
  const invoiceColumns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'invoices'
    ORDER BY ordinal_position
  `;

  console.log('Invoices table columns:');
  console.log(invoiceColumns);

  // Get actual column names for payments table
  const paymentColumns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'payments'
    ORDER BY ordinal_position
  `;

  console.log('\nPayments table columns:');
  console.log(paymentColumns);

  // Get actual column names for clients table
  const clientColumns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'clients'
    ORDER BY ordinal_position
  `;

  console.log('\nClients table columns:');
  console.log(clientColumns);

  await prisma.$disconnect();
}

checkActualSchema().catch(console.error);
