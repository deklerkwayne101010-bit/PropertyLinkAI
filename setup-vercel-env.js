#!/usr/bin/env node

/**
 * Vercel Environment Setup Helper
 * This script helps you set up environment variables for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Real Estate AI - Vercel Environment Setup\n');

// Check if we're in the right directory
if (!fs.existsSync('real-estate-ai-backend') || !fs.existsSync('real-estate-ai-frontend')) {
  console.error('❌ Please run this script from the root directory of the project');
  process.exit(1);
}

console.log('📝 This script will help you configure environment variables for Vercel deployment\n');

console.log('🔧 Required Services:');
console.log('1. Supabase (Database) - https://supabase.com');
console.log('2. Upstash Redis (Caching) - https://upstash.com');
console.log('3. SendGrid (Email) - https://sendgrid.com');
console.log('4. OpenAI (AI Features) - https://platform.openai.com\n');

console.log('📋 Environment Variables Needed:\n');

// Backend Environment Variables
console.log('🔒 BACKEND ENVIRONMENT VARIABLES (real-estate-ai-backend/.env):');
console.log('DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"');
console.log('SUPABASE_URL="https://[PROJECT-REF].supabase.co"');
console.log('SUPABASE_ANON_KEY="your-anon-key"');
console.log('REDIS_URL="https://[YOUR-REDIS-URL].upstash.io"');
console.log('REDIS_TOKEN="your-redis-token"');
console.log('OPENAI_API_KEY="your-openai-api-key"');
console.log('SMTP_HOST="smtp.sendgrid.net"');
console.log('SMTP_PORT="587"');
console.log('SMTP_USER="apikey"');
console.log('SMTP_PASS="your-sendgrid-api-key"');
console.log('JWT_SECRET="your-super-secret-jwt-key-here"');
console.log('NODE_ENV="production"\n');

// Frontend Environment Variables
console.log('🌐 FRONTEND ENVIRONMENT VARIABLES (real-estate-ai-frontend/web/.env):');
console.log('REACT_APP_API_URL="https://your-backend-url.vercel.app"');
console.log('REACT_APP_SUPABASE_URL="https://[PROJECT-REF].supabase.co"');
console.log('REACT_APP_SUPABASE_ANON_KEY="your-anon-key"\n');

console.log('📝 INSTRUCTIONS:');
console.log('1. Create accounts on all required services above');
console.log('2. Get your API keys and connection strings');
console.log('3. Update the .env files with your actual values');
console.log('4. Push to GitHub: git add . && git commit -m "Setup for Vercel" && git push');
console.log('5. Deploy backend to Vercel first (root directory: real-estate-ai-backend)');
console.log('6. Copy backend URL and update REACT_APP_API_URL in frontend .env');
console.log('7. Deploy frontend to Vercel (root directory: real-estate-ai-frontend/web)');
console.log('8. Test your live application!\n');

console.log('💡 TIPS:');
console.log('- Use the pooled connection string from Supabase for DATABASE_URL');
console.log('- Generate a strong JWT_SECRET (you can use: openssl rand -base64 32)');
console.log('- All services have free tiers to get started');
console.log('- Check Vercel function logs if you encounter issues\n');

console.log('🎯 READY TO DEPLOY?');
console.log('Once you have all the environment variables set up, run:');
console.log('git add . && git commit -m "Configure for Vercel deployment" && git push origin main\n');

console.log('Then follow the deployment guide in VERCEL_DEPLOYMENT_GUIDE.md\n');

console.log('✅ Happy deploying! 🚀');