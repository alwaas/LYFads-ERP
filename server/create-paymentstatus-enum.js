const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_g06KCRUbnfVy@ep-fragrant-sunset-azec27rx-pooler.c-3.ap-southeast-1.aws.neon.tech/lyfads_erp_test?sslmode=require&channel_binding=require",
    },
  },
});

async function main() {
  // Check if PaymentStatus enum exists
  const enumExists = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM pg_type 
      WHERE typname = 'PaymentStatus' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
  `;
  console.log('PaymentStatus enum exists:', enumExists);

  if (!enumExists[0].exists) {
    // Create PaymentStatus enum
    await prisma.$executeRaw`
      CREATE TYPE "PaymentStatus" AS ENUM ('ACTIVE', 'REVERSED', 'VOID')
    `;
    console.log('Created PaymentStatus enum');
  }

  // Set status column to use the enum
  try {
    await prisma.$executeRaw`
      ALTER TABLE "payments" 
      ALTER COLUMN "status" TYPE "PaymentStatus" 
      USING "status"::text::"PaymentStatus"
    `;
    console.log('Set status column type to PaymentStatus');
  } catch (e) {
    console.log('Set type error:', e.message);
  }

  // Verify
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'payments' 
      AND column_name = 'status'
  `;
  console.log('Status column:', cols);

  await prisma.$disconnect();
}

main().catch(console.error);
