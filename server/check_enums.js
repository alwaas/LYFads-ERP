const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const enums = await prisma.$queryRaw`
      SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname
    `;
    console.log('ENUMS:', enums);
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
