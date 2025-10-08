const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runSQL() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing SQL script...');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await prisma.$executeRawUnsafe(trimmed + ';');
          console.log('Executed statement successfully');
        } catch (error) {
          console.log('Statement failed (might be expected):', error.message);
        }
      }
    }

    console.log('SQL script execution completed!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Database operation failed:', error.message);
  }
}

runSQL();