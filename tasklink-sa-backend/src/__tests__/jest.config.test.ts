// Jest configuration for TaskLink SA backend tests
export const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.test.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  // South African timezone for consistent testing
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

// Test database configuration
export const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'tasklink_test',
  username: process.env.TEST_DB_USER || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
};

// PayFast test configuration
export const payfastTestConfig = {
  merchantId: 'test_merchant_id',
  merchantKey: 'test_merchant_key',
  passphrase: 'test_passphrase',
  testMode: true,
  returnUrl: 'https://test.tasklink.co.za/payment/return',
  cancelUrl: 'https://test.tasklink.co.za/payment/cancel',
  notifyUrl: 'https://test.tasklink.co.za/payment/notify',
};

// Redis test configuration
export const redisTestConfig = {
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  password: process.env.TEST_REDIS_PASSWORD || '',
  db: parseInt(process.env.TEST_REDIS_DB || '1'),
};

// JWT test configuration
export const jwtTestConfig = {
  secret: 'test_jwt_secret_key_for_testing_only',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
};

// Email test configuration
export const emailTestConfig = {
  host: 'smtp.test.com',
  port: 587,
  secure: false,
  auth: {
    user: 'test@test.com',
    pass: 'test_password',
  },
  from: 'noreply@test.tasklink.co.za',
};

// SMS test configuration
export const smsTestConfig = {
  apiKey: 'test_sms_api_key',
  apiSecret: 'test_sms_api_secret',
  from: '+27710000000',
};

// Location service test configuration
export const locationTestConfig = {
  googleMapsApiKey: 'test_google_maps_api_key',
  defaultCountry: 'ZA',
  defaultLanguage: 'en',
};

// Security test configuration
export const securityTestConfig = {
  bcryptRounds: 4, // Lower for faster tests
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  passwordMinLength: 8,
  passwordMaxLength: 128,
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
};

// Performance test configuration
export const performanceTestConfig = {
  maxResponseTime: 1000, // 1 second
  maxDatabaseQueryTime: 100, // 100ms
  loadTestDuration: 30000, // 30 seconds
  loadTestConcurrency: 10,
  stressTestConcurrency: 50,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
};

// South African market test configuration
export const southAfricanTestConfig = {
  currency: 'ZAR',
  locale: 'en-ZA',
  timezone: 'Africa/Johannesburg',
  phoneRegex: /^\+27[0-9]{9}$/,
  idNumberRegex: /^[0-9]{13}$/,
  postalCodeRegex: /^[0-9]{4}$/,
  provinces: [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ],
  majorCities: [
    'Cape Town',
    'Johannesburg',
    'Durban',
    'Pretoria',
    'Port Elizabeth',
    'Bloemfontein',
    'Nelspruit',
    'Polokwane',
    'Kimberley',
    'Rustenburg',
  ],
  officialLanguages: [
    'Afrikaans',
    'English',
    'isiNdebele',
    'isiXhosa',
    'isiZulu',
    'Sepedi',
    'Sesotho',
    'Setswana',
    'siSwati',
    'Tshivenda',
    'Xitsonga',
  ],
  taxRate: 0.15, // 15% VAT
  minimumWage: 23.19, // R23.19 per hour (2023)
  platformFee: 0.05, // 5% platform fee
};

// Test data factories
export const testDataFactories = {
  user: {
    valid: () => ({
      email: `test${Date.now()}@example.com`,
      phone: '+27712345678',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      location: 'Cape Town, Western Cape',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      skills: ['cleaning', 'gardening'],
      isVerified: true,
      verificationType: 'email',
      idNumber: '9001015000089',
    }),
    invalid: {
      email: 'invalid-email',
      phone: '123',
      password: '123',
      firstName: '',
      lastName: '',
      location: '',
    },
  },
  job: {
    valid: (posterId: string) => ({
      title: 'Test Job Title',
      description: 'Test job description',
      category: 'cleaning',
      location: 'Cape Town, Western Cape',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      budget: 500.00,
      budgetType: 'fixed',
      posterId,
      requirements: ['cleaning'],
      images: [],
    }),
    invalid: {
      title: '',
      description: '',
      category: '',
      budget: -100,
    },
  },
  application: {
    valid: (jobId: string, applicantId: string) => ({
      jobId,
      applicantId,
      message: 'I would like to apply for this job',
      proposedRate: 450.00,
      status: 'PENDING',
    }),
  },
  payment: {
    valid: (jobId: string, clientId: string, workerId: string) => ({
      amount: 500.00,
      currency: 'ZAR',
      status: 'PENDING',
      jobId,
      clientId,
      workerId,
      fee: 25.00,
      netAmount: 475.00,
    }),
  },
};

// Mock implementations for external services
export const mockImplementations = {
  payfast: {
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
    refundPayment: jest.fn(),
  },
  location: {
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
    calculateDistance: jest.fn(),
  },
  notification: {
    sendPush: jest.fn(),
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
  },
  socket: {
    emitToUser: jest.fn(),
    emitToRoom: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
  },
};

// Test utilities
export const testUtils = {
  // Generate unique test data
  generateUniqueId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test file buffer
  generateFileBuffer: (size: number = 1024) => Buffer.alloc(size, 'test data'),

  // Generate test image buffer
  generateImageBuffer: () => {
    // Simple 1x1 pixel PNG buffer for testing
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00, 0x0B, 0x13, 0x00, 0x00, 0x0B,
      0x13, 0x01, 0x00, 0x9A, 0x9C, 0x18, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44,
      0x41, 0x54, 0x18, 0x57, 0x63, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04,
      0x00, 0x01, 0x27, 0x6B, 0xB4, 0x44, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
      0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
    ]);
  },

  // Validate South African context
  validateSouthAfricanContext: (data: any) => {
    const errors: string[] = [];

    if (data.phone && !data.phone.match(/^\+27[0-9]{9}$/)) {
      errors.push('Phone number must be in South African format (+27XXXXXXXXX)');
    }

    if (data.location && !southAfricanTestConfig.majorCities.some(city =>
      data.location.includes(city)
    )) {
      errors.push('Location must be in South Africa');
    }

    if (data.budget && (data.budget < 50 || data.budget > 50000)) {
      errors.push('Budget must be between R50 and R50,000');
    }

    return errors;
  },

  // Generate realistic South African test data
  generateSouthAfricanTestData: () => ({
    phone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
    location: southAfricanTestConfig.majorCities[
      Math.floor(Math.random() * southAfricanTestConfig.majorCities.length)
    ],
    coordinates: {
      lat: -33.9249 + (Math.random() - 0.5) * 0.2,
      lng: 18.4241 + (Math.random() - 0.5) * 0.2,
    },
    idNumber: `${Math.floor(Math.random() * 100) + 1900}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}089`,
  }),
};

// Custom Jest matchers for South African context
expect.extend({
  toBeValidSouthAfricanPhone(received: string) {
    const pass = /^\+27[0-9]{9}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid South African phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid South African phone number`,
        pass: false,
      };
    }
  },

  toBeValidZARAmount(received: number) {
    const pass = received > 0 && received <= 100000 && Number.isFinite(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ZAR amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ZAR amount (0 < amount <= 100000)`,
        pass: false,
      };
    }
  },

  toBeValidSouthAfricanLocation(received: string) {
    const pass = southAfricanTestConfig.majorCities.some(city => received.includes(city));
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid South African location`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid South African location`,
        pass: false,
      };
    }
  },

  toBeValidSouthAfricanIdNumber(received: string) {
    const pass = /^[0-9]{13}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid South African ID number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid South African ID number (13 digits)`,
        pass: false,
      };
    }
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSouthAfricanPhone(): R;
      toBeValidZARAmount(): R;
      toBeValidSouthAfricanLocation(): R;
      toBeValidSouthAfricanIdNumber(): R;
    }
  }
}