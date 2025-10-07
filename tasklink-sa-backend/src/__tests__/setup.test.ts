import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

// Create a separate test database for testing
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/tasklink_test';

declare global {
  var __TEST_DB__: PrismaClient;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

global.__TEST_DB__ = prisma;

export const setupTestDatabase = async () => {
  try {
    // Run migrations on test database
    execSync(`cd ${path.join(__dirname, '../..')} && npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

export const cleanupTestDatabase = async () => {
  try {
    // Clear all data from test database
    await prisma.dispute.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
};

export const closeTestDatabase = async () => {
  await prisma.$disconnect();
};

// Test utilities for creating test data
export const createTestUser = async (overrides = {}) => {
  return await prisma.user.create({
    data: {
      email: `test${Date.now()}@example.com`,
      phone: '+27712345678',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      location: 'Cape Town, South Africa',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      skills: ['cleaning', 'gardening'],
      isVerified: true,
      verificationType: 'email',
      ...overrides,
    },
  });
};

export const createTestJob = async (posterId: string, overrides = {}) => {
  return await prisma.job.create({
    data: {
      title: 'Test Job',
      description: 'This is a test job description',
      category: 'cleaning',
      location: 'Cape Town, South Africa',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      budget: 500.00,
      budgetType: 'fixed',
      status: 'OPEN',
      posterId,
      requirements: ['cleaning'],
      images: [],
      ...overrides,
    },
  });
};

export const createTestApplication = async (jobId: string, applicantId: string, overrides = {}) => {
  return await prisma.application.create({
    data: {
      jobId,
      applicantId,
      message: 'I would like to apply for this job',
      proposedRate: 450.00,
      status: 'PENDING',
      ...overrides,
    },
  });
};

// Mock data factories for South African context
export const southAfricanLocations = [
  'Cape Town, Western Cape',
  'Johannesburg, Gauteng',
  'Durban, KwaZulu-Natal',
  'Pretoria, Gauteng',
  'Port Elizabeth, Eastern Cape',
  'Bloemfontein, Free State',
  'Nelspruit, Mpumalanga',
  'Polokwane, Limpopo',
  'Kimberley, Northern Cape',
  'Rustenburg, North West',
];

export const jobCategories = [
  'cleaning',
  'gardening',
  'tutoring',
  'handyman',
  'pet-care',
  'delivery',
  'moving',
  'babysitting',
  'cooking',
  'laundry',
  'shopping',
  'administrative',
  'technical-support',
  'event-help',
  'fitness-training',
];

export const southAfricanSkills = [
  'house-cleaning',
  'deep-cleaning',
  'garden-maintenance',
  'lawn-mowing',
  'tree-pruning',
  'mathematics-tutoring',
  'english-tutoring',
  'afrikaans-tutoring',
  'plumbing',
  'electrical',
  'painting',
  'dog-walking',
  'pet-sitting',
  'grocery-shopping',
  'laundry-service',
  'cooking',
  'baking',
  'childcare',
  'elderly-care',
  'computer-repair',
  'phone-repair',
  'car-wash',
  'furniture-assembly',
  'packing-moving',
  'event-setup',
  'photography',
  'videography',
  'music-lessons',
  'fitness-training',
  'yoga-instruction',
  'language-translation',
  'document-typing',
  'data-entry',
  'social-media-management',
];

export const generateSouthAfricanPhoneNumber = () => {
  const prefixes = ['071', '072', '073', '074', '076', '078', '079', '081', '082', '083', '084'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+27${prefix}${suffix}`;
};

export const generateSouthAfricanIdNumber = () => {
  const year = Math.floor(Math.random() * (2005 - 1950) + 1950);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const gender = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const race = '8'; // South African citizen
  const checksum = '0'; // Simplified for testing

  return `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${gender}${race}${checksum}`;
};

// Test data generators
export const generateTestUserData = (overrides = {}) => ({
  email: `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
  phone: generateSouthAfricanPhoneNumber(),
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  location: southAfricanLocations[Math.floor(Math.random() * southAfricanLocations.length)],
  coordinates: {
    lat: -33.9249 + (Math.random() - 0.5) * 0.1,
    lng: 18.4241 + (Math.random() - 0.5) * 0.1,
  },
  skills: southAfricanSkills.slice(0, Math.floor(Math.random() * 5) + 1),
  isVerified: Math.random() > 0.5,
  verificationType: Math.random() > 0.5 ? 'email' : 'phone',
  idNumber: generateSouthAfricanIdNumber(),
  ...overrides,
});

export const generateTestJobData = (posterId: string, overrides = {}) => ({
  title: 'Test Job Title',
  description: 'This is a detailed job description for testing purposes.',
  category: jobCategories[Math.floor(Math.random() * jobCategories.length)],
  location: southAfricanLocations[Math.floor(Math.random() * southAfricanLocations.length)],
  coordinates: {
    lat: -33.9249 + (Math.random() - 0.5) * 0.1,
    lng: 18.4241 + (Math.random() - 0.5) * 0.1,
  },
  budget: Math.floor(Math.random() * 1000) + 100, // R100 - R1100
  budgetType: Math.random() > 0.5 ? 'fixed' : 'hourly',
  estimatedHours: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 1 : undefined,
  status: 'OPEN',
  posterId,
  requirements: southAfricanSkills.slice(0, Math.floor(Math.random() * 3) + 1),
  preferredSkills: southAfricanSkills.slice(0, Math.floor(Math.random() * 3) + 1),
  equipmentNeeded: [],
  images: [],
  ...overrides,
});

// Authentication helpers for tests
export const generateTestToken = (userId: string) => {
  // This would use your actual JWT signing logic
  return `test_token_${userId}_${Date.now()}`;
};

export const mockAuthMiddleware = (userId: string) => ({
  req: {
    user: { id: userId },
    headers: { authorization: `Bearer ${generateTestToken(userId)}` },
  },
  res: {},
  next: jest.fn(),
});

// Payment test helpers
export const mockPayFastPayment = (amount: number, jobId: string) => ({
  m_payment_id: `test_${Date.now()}`,
  pf_payment_id: Math.floor(Math.random() * 1000000),
  payment_status: 'COMPLETE',
  item_name: `Job Payment - ${jobId}`,
  item_description: 'Payment for completed job',
  amount_gross: amount,
  amount_fee: amount * 0.05, // 5% fee
  amount_net: amount * 0.95,
  custom_str1: jobId,
  custom_str2: 'test_user_id',
  signature: 'test_signature',
});

// Location test helpers
export const mockGeocodingResponse = (address: string) => ({
  results: [{
    geometry: {
      location: {
        lat: -33.9249 + (Math.random() - 0.5) * 0.1,
        lng: 18.4241 + (Math.random() - 0.5) * 0.1,
      },
    },
    formatted_address: address,
  }],
});

// Socket test helpers
export const mockSocketConnection = () => ({
  id: `socket_${Date.now()}`,
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
});

export const mockSocketServer = () => ({
  to: jest.fn(() => ({
    emit: jest.fn(),
  })),
  emit: jest.fn(),
  on: jest.fn(),
});

// Performance test helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

export const generateLoadTestData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test_${i}`,
    data: `test_data_${i}`,
    timestamp: new Date(),
  }));
};

// Security test helpers
export const maliciousInputs = {
  sqlInjection: ["'; DROP TABLE users; --", "1' OR '1'='1", "admin'--"],
  xss: ['<script>alert("xss")</script>', '<img src="x" onerror="alert(1)">', 'javascript:alert(1)'],
  pathTraversal: ['../../../etc/passwd', '..\\..\\windows\\system32', '/etc/passwd'],
  commandInjection: ['; rm -rf /', '| cat /etc/passwd', '&& whoami'],
  largeInput: 'A'.repeat(10000),
  specialCharacters: '!@#$%^&*()_+{}|:<>?[]\\;\'",./',
};

export const validateSouthAfricanContext = (data: any) => {
  const errors: string[] = [];

  if (data.phone && !data.phone.startsWith('+27')) {
    errors.push('Phone number should be in South African format (+27)');
  }

  if (data.location && !southAfricanLocations.some(loc => data.location.includes(loc.split(',')[0]))) {
    errors.push('Location should be in South Africa');
  }

  if (data.budget && (data.budget < 50 || data.budget > 50000)) {
    errors.push('Budget should be between R50 and R50,000');
  }

  return errors;
};

// Test assertion helpers
export const expectSouthAfricanContext = (data: any) => {
  const errors = validateSouthAfricanContext(data);
  if (errors.length > 0) {
    throw new Error(`South African context validation failed: ${errors.join(', ')}`);
  }
};

export const expectValidZARAmount = (amount: number) => {
  expect(amount).toBeGreaterThan(0);
  expect(amount).toBeLessThan(100000); // Reasonable upper limit
  expect(Number.isFinite(amount)).toBe(true);
};

export const expectValidSouthAfricanPhone = (phone: string) => {
  expect(phone).toMatch(/^\+27[0-9]{9}$/);
};

export const expectValidEmail = (email: string) => {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

export const expectValidCoordinates = (coords: { lat: number; lng: number }) => {
  expect(coords.lat).toBeGreaterThanOrEqual(-90);
  expect(coords.lat).toBeLessThanOrEqual(90);
  expect(coords.lng).toBeGreaterThanOrEqual(-180);
  expect(coords.lng).toBeLessThanOrEqual(180);
};

// Error handling for tests
export const expectError = async (fn: () => Promise<any>, errorType?: any) => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error of type ${errorType.name}, got ${(error as Error).constructor.name}`);
    }
  }
};

// Database transaction helpers for tests
export const withTestTransaction = async (fn: (tx: any) => Promise<any>) => {
  return await prisma.$transaction(async (tx: any) => {
    return await fn(tx);
  });
};

// Mock external services
export const mockPayFastService = () => ({
  createPayment: jest.fn(),
  verifyPayment: jest.fn(),
  refundPayment: jest.fn(),
});

export const mockLocationService = () => ({
  geocode: jest.fn(),
  reverseGeocode: jest.fn(),
  calculateDistance: jest.fn(),
});

export const mockNotificationService = () => ({
  sendPushNotification: jest.fn(),
  sendEmail: jest.fn(),
  sendSMS: jest.fn(),
});

export const mockSocketService = () => ({
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
});

// Test database configuration
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

beforeEach(async () => {
  await cleanupTestDatabase();
});

afterEach(async () => {
  // Additional cleanup if needed
});