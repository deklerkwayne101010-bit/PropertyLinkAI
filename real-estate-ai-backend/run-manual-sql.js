import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function runManualSQL() {
  try {
    console.log('Running manual SQL script...');

    // Read the SQL file
    const sql = fs.readFileSync('./create-tables-manual.sql', 'utf8');

    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement + ';');
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('🎉 All SQL statements executed successfully!');

    // Test that tables were created
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%User%' OR table_name LIKE '%Property%'`;
    console.log('📋 Created tables:', tables);

  } catch (error) {
    console.error('❌ Error executing manual SQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runManualSQL();