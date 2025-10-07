const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

testConnection();