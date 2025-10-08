import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Try to query existing tables
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📋 Existing tables:', result);

    // Try to create a simple test table
    console.log('Creating test table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Test table created');

    // Insert a test record
    await prisma.$executeRaw`
      INSERT INTO test_connection (message) VALUES ('Database connection test successful')
    `;
    console.log('✅ Test record inserted');

    // Query the test record
    const records = await prisma.$queryRaw`SELECT * FROM test_connection`;
    console.log('📄 Test records:', records);

    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();