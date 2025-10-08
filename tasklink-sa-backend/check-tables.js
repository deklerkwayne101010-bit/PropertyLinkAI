const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
  ssl: false
});

async function checkTables() {
  try {
    await client.connect();
    console.log('Database connection successful!');

    // Check what tables exist in the public schema
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\nExisting tables in public schema:');
    const existingTables = result.rows.map(row => row.table_name);
    console.log(existingTables.join(', '));

    // Check specific tables
    const expectedTables = [
      'users',
      'jobs',
      'applications',
      'payments',
      'reviews',
      'messages',
      'notifications',
      'audit_logs',
      'email_verification_tokens',
      'password_reset_tokens',
      'disputes'
    ];

    console.log('\nChecking expected tables:');
    let allExist = true;
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✓ ${table} - EXISTS`);
      } else {
        console.log(`✗ ${table} - DOES NOT EXIST`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log('\n🎉 All expected tables are present in the database!');
    } else {
      console.log('\n❌ Some tables are missing from the database.');
    }

    await client.end();
  } catch (error) {
    console.error('Database operation failed:', error.message);
  }
}

checkTables();