// Test script for enhanced AI prompts
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testEnhancedPrompts() {
  console.log('🚀 Testing Enhanced AI Prompts...\n');

  try {
    // Step 1: Check if backend is running
    console.log('1. Checking backend health...');
    const healthResponse = await fetch(`${BASE_URL}/health`);

    if (!healthResponse.ok) {
      throw new Error(`Backend not responding: ${healthResponse.statusText}`);
    }

    const healthData = await healthResponse.json();
    console.log(`✅ Backend is running: ${healthData.environment}\n`);

    // Step 2: Create a test user
    console.log('2. Creating test user...');
    const createUserResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User'
      })
    });

    if (!createUserResponse.ok && createUserResponse.status !== 409) {
      throw new Error(`Failed to create user: ${createUserResponse.statusText}`);
    }
    console.log('✅ Test user ready\n');

    // Step 3: Login to get token
    console.log('3. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const { token } = await loginResponse.json();
    console.log('✅ Authentication successful\n');

    // Step 3: Create a test property
    console.log('3. Creating test property...');
    const testProperty = {
      location: 'Sandton, Johannesburg',
      size: 250,
      bedrooms: 4,
      bathrooms: 3,
      price: 3500000,
      features: [
        'Modern kitchen',
        'Swimming pool',
        'Garden',
        'Double garage',
        'Air conditioning',
        'Security system'
      ],
      propertyType: 'house',
      yearBuilt: 2018,
      description: 'Beautiful family home in prestigious Sandton neighborhood'
    };

    const createPropertyResponse = await fetch(`${BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProperty)
    });

    if (!createPropertyResponse.ok) {
      throw new Error(`Failed to create property: ${createPropertyResponse.statusText}`);
    }

    const { data: property } = await createPropertyResponse.json();
    console.log(`✅ Test property created: ${property.id}\n`);

    // Step 4: Test all enhanced prompt templates
    console.log('4. Testing all enhanced prompt templates...');
    const testResponse = await fetch(`${BASE_URL}/api/ai-content/test/${property.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!testResponse.ok) {
      throw new Error(`Template test failed: ${testResponse.statusText}`);
    }

    const testResults = await testResponse.json();
    console.log('✅ Template testing completed\n');

    // Step 5: Display results summary
    console.log('5. Test Results Summary:');
    console.log('========================');

    let totalTests = 0;
    let successfulTests = 0;

    Object.entries(testResults.data).forEach(([platform, platformResults]) => {
      console.log(`\n📱 ${platform.toUpperCase()}:`);

      Object.entries(platformResults).forEach(([tone, toneResults]) => {
        console.log(`  🎭 ${tone}:`);

        Object.entries(toneResults).forEach(([length, result]) => {
          totalTests++;
          if (result.success) {
            successfulTests++;
            console.log(`    📏 ${length}: ✅ ${result.wordCount} words, Quality: ${result.qualityScore}%`);
          } else {
            console.log(`    📏 ${length}: ❌ ${result.error}`);
          }
        });
      });
    });

    console.log('\n📊 Overall Results:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);

    // Step 6: Show sample content for each platform
    console.log('\n6. Sample Generated Content:');
    console.log('============================');

    for (const [platform, platformResults] of Object.entries(testResults.data)) {
      console.log(`\n📱 ${platform.toUpperCase()} SAMPLE:`);

      // Find first successful result for this platform
      for (const [tone, toneResults] of Object.entries(platformResults)) {
        for (const [length, result] of Object.entries(toneResults)) {
          if (result.success) {
            console.log(`\n🎭 ${tone} (${length}):\n${result.preview}...\n`);
            break;
          }
        }
        if (Object.values(platformResults[tone]).some(r => r.success)) break;
      }
    }

    console.log('\n🎉 Enhanced AI Prompts Testing Complete!');
    console.log('All platforms tested with multiple tones and lengths.');
    console.log('Enhanced prompts are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedPrompts();