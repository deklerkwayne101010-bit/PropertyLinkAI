const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');

    // Check what tables exist in the public schema
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('\nExisting tables in public schema:');
    if (result.length === 0) {
      console.log('No tables found');
    } else {
      result.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Database operation failed:', error.message);
  }
}

checkSchema();