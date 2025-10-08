const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runSimpleSQL() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-tables-simple.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing simplified SQL script...');

    // Split the SQL into individual statements (by CREATE TABLE)
    const statements = sql.split('CREATE TABLE').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      const fullStatement = 'CREATE TABLE' + statement.trim();
      if (fullStatement) {
        try {
          console.log('Executing:', fullStatement.substring(0, 50) + '...');
          await prisma.$executeRawUnsafe(fullStatement);
          console.log('✓ Statement executed successfully');
        } catch (error) {
          console.log('✗ Statement failed:', error.message);
        }
      }
    }

    console.log('SQL script execution completed!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Database operation failed:', error.message);
  }
}

runSimpleSQL();