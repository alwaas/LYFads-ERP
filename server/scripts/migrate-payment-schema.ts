import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePaymentSchema() {
  console.log('=== MIGRATING PAYMENT SCHEMA ===\n');

  try {
    // Step 1: Check if we need to rename the existing Payment table to payments
    const paymentTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Payment'
      )
    `;

    const paymentsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'payments'
      )
    `;

    console.log('Payment table exists:', paymentTableExists);
    console.log('payments table exists:', paymentsTableExists);

    if ((paymentTableExists as any)[0].exists && !(paymentsTableExists as any)[0].exists) {
      console.log('Renaming Payment table to payments...');
      await prisma.$executeRaw`ALTER TABLE "Payment" RENAME TO "payments"`;
      console.log('✓ Renamed Payment to payments');
    }

    // Step 2: Check if PaymentAllocation table needs renaming
    const paymentAllocationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'PaymentAllocation'
      )
    `;

    const paymentAllocationsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'payment_allocations'
      )
    `;

    console.log('\nPaymentAllocation table exists:', paymentAllocationTableExists);
    console.log('payment_allocations table exists:', paymentAllocationsTableExists);

    if ((paymentAllocationTableExists as any)[0].exists && !(paymentAllocationsTableExists as any)[0].exists) {
      console.log('Renaming PaymentAllocation table to payment_allocations...');
      await prisma.$executeRaw`ALTER TABLE "PaymentAllocation" RENAME TO "payment_allocations"`;
      console.log('✓ Renamed PaymentAllocation to payment_allocations');
    }

    // Step 3: Add new columns to payments table if they don't exist
    const paymentColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payments'
    `;

    const columnNames = (paymentColumns as any).map((col: any) => col.column_name);

    console.log('\nCurrent payment columns:', columnNames);

    // Add clientId column if missing
    if (!columnNames.includes('clientId')) {
      console.log('Adding clientId column to payments...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ADD COLUMN "clientId" TEXT
      `;
      console.log('✓ Added clientId column');
    }

    // Add status column if missing
    if (!columnNames.includes('status')) {
      console.log('Adding status column to payments...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ADD COLUMN "status" TEXT DEFAULT 'ACTIVE'
      `;
      console.log('✓ Added status column');
    }

    // Add createdById column if missing
    if (!columnNames.includes('createdById')) {
      console.log('Adding createdById column to payments...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ADD COLUMN "createdById" TEXT
      `;
      console.log('✓ Added createdById column');
    }

    // Step 4: Add foreign key for clientId if missing
    const clientFKExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'payments'
        AND kcu.column_name = 'clientId'
        AND tc.constraint_type = 'FOREIGN KEY'
      )
    `;

    if (!(clientFKExists as any)[0].exists) {
      console.log('Adding foreign key for clientId...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ADD CONSTRAINT "payments_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "clients"("id")
        ON DELETE SET NULL
      `;
      console.log('✓ Added clientId foreign key');
    }

    // Step 5: Add foreign key for createdById if missing
    const createdByFKExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'payments'
        AND kcu.column_name = 'createdById'
        AND tc.constraint_type = 'FOREIGN KEY'
      )
    `;

    if (!(createdByFKExists as any)[0].exists) {
      console.log('Adding foreign key for createdById...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ADD CONSTRAINT "payments_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "users"("id")
        ON DELETE SET NULL
      `;
      console.log('✓ Added createdById foreign key');
    }

    // Step 6: Make invoiceId nullable if it's not already
    const invoiceIdColumn = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments'
      AND column_name = 'invoiceId'
    `;

    if ((invoiceIdColumn as any).length > 0 && (invoiceIdColumn as any)[0].is_nullable === 'NO') {
      console.log('Making invoiceId nullable...');
      await prisma.$executeRaw`
        ALTER TABLE "payments"
        ALTER COLUMN "invoiceId" DROP NOT NULL
      `;
      console.log('✓ Made invoiceId nullable');
    }

    // Step 7: Update existing payments to migrate clientId from invoice
    console.log('\nMigrating clientId from invoices to payments...');
    const migrationResult = await prisma.$executeRaw`
      UPDATE "payments"
      SET "clientId" = (
        SELECT "clientId"
        FROM "invoices"
        WHERE "invoices"."id" = "payments"."invoiceId"
      )
      WHERE "clientId" IS NULL AND "invoiceId" IS NOT NULL
    `;
    console.log(`✓ Migrated ${migrationResult} payments to have clientId`);

    // Step 8: Create indexes if missing
    console.log('\nCreating indexes...');

    const indexes = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'payments'
    `;

    const indexNames = (indexes as any).map((idx: any) => idx.indexname);

    if (!indexNames.includes('payments_clientId_tenantId_idx')) {
      await prisma.$executeRaw`
        CREATE INDEX "payments_clientId_tenantId_idx" ON "payments"("clientId", "tenantId")
      `;
      console.log('✓ Created clientId_tenantId index');
    }

    if (!indexNames.includes('payments_status_tenantId_idx')) {
      await prisma.$executeRaw`
        CREATE INDEX "payments_status_tenantId_idx" ON "payments"("status", "tenantId")
      `;
      console.log('✓ Created status_tenantId index');
    }

    console.log('\n=== PAYMENT SCHEMA MIGRATION COMPLETE ===');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migratePaymentSchema().catch(console.error);
