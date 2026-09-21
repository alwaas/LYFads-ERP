import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentsTable() {
  console.log('=== CHECKING PAYMENTS TABLE STATUS ===\n');

  // Check if payments table exists
  const tableExists = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'payments'
    )
  `;

  console.log('Payments table exists:', tableExists);

  // Check for any table with "payment" in the name
  const paymentTables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name ILIKE '%payment%'
  `;

  console.log('\nTables with "payment" in name:');
  console.log(paymentTables);

  // Check if there are any payment-related foreign keys
  const paymentFKs = await prisma.$queryRaw`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name ILIKE '%payment%' OR ccu.table_name ILIKE '%payment%')
  `;

  console.log('\nPayment-related foreign keys:');
  console.log(paymentFKs);

  await prisma.$disconnect();
}

checkPaymentsTable().catch(console.error);
