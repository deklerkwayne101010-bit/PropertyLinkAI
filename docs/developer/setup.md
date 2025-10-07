# Developer Setup Guide

This guide provides step-by-step instructions for setting up a local development environment for TaskLink SA. The platform consists of three main components: backend API, web frontend, and mobile app.

## 🏗️ System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Processor**: Intel Core i5 or equivalent
- **Memory**: 8GB RAM (16GB recommended)
- **Storage**: 20GB free space
- **Network**: Stable internet connection

### Development Tools
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **PostgreSQL**: v13 or higher
- **Redis**: v6 or higher (optional, for caching)

### Mobile Development (Optional)
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **Java JDK**: v11 or higher

## 🚀 Backend Setup (Node.js/Express)

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/tasklink-sa/tasklink-sa-backend.git
cd tasklink-sa-backend

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tasklink_sa_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# PayFast (Sandbox)
PAYFAST_MERCHANT_ID="10000100"
PAYFAST_MERCHANT_KEY="46f0cd694581a"
PAYFAST_PASSPHRASE="your-passphrase"
PAYFAST_SANDBOX=true

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Google Maps API (for location services)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Application
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### 3. Database Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb tasklink_sa_dev

# Install Prisma CLI globally (if not already installed)
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

### 4. Redis Setup (Optional)
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis-server

# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Windows)
# Download from: https://redis.io/download
```

### 5. Start Development Server
```bash
# Development mode with auto-reload
npm run dev

# Or build and start production version
npm run build
npm start

# Server will be available at: http://localhost:3001
```

### 6. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:unit
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 🌐 Web Frontend Setup (React)

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/tasklink-sa/tasklink-sa-frontend.git
cd tasklink-sa-frontend

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Required Environment Variables:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_WS_URL=ws://localhost:3001

# Google Maps (for location features)
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# PayFast (Sandbox)
REACT_APP_PAYFAST_MERCHANT_ID=10000100
REACT_APP_PAYFAST_SANDBOX=true

# Application
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### 3. Start Development Server
```bash
# Start development server
npm start

# Application will be available at: http://localhost:3000
```

### 4. Build for Production
```bash
# Create production build
npm run build

# Serve production build locally
npm install -g serve
serve -s build -l 3000
```

### 5. Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📱 Mobile App Setup (React Native)

### Prerequisites
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# For iOS (macOS only)
# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods

# For Android
# Install Android Studio
# Install Android SDK
# Set up ANDROID_HOME environment variable
```

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/tasklink-sa/TaskLinkSAMobile.git
cd TaskLinkSAMobile

# Install dependencies
npm install
```

### 2. iOS Setup (macOS only)
```bash
# Install iOS dependencies
cd ios
pod install
cd ..
```

### 3. Android Setup
```bash
# Create local.properties file
echo "sdk.dir = /path/to/Android/sdk" > android/local.properties

# Or let React Native auto-detect
# The Android SDK path will be auto-detected if ANDROID_HOME is set
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# API Configuration
API_URL=http://localhost:3001/api/v1
WS_URL=ws://localhost:3001

# App Configuration
APP_ENV=development
APP_VERSION=1.0.0

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Push Notifications (Optional)
FCM_SERVER_KEY=your-fcm-server-key
```

### 5. Start Development Server
```bash
# Start Metro bundler
npm start

# In another terminal, run on iOS simulator
npm run ios

# Or run on Android emulator/device
npm run android
```

### 6. Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Workflow

### Code Quality Tools
```bash
# Backend linting
cd tasklink-sa-backend
npm run lint
npm run lint:fix

# Frontend linting
cd tasklink-sa-frontend
npm run lint

# Mobile linting
cd TaskLinkSAMobile
npm run lint
```

### Database Management
```bash
# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

# Update Prisma schema
npx prisma db push
```

### API Testing
```bash
# Test API endpoints with curl
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Or use tools like Postman, Insomnia, or Thunder Client
```

### Debugging
```bash
# Backend debugging
npm run dev:debug  # Starts with --inspect flag

# Frontend debugging
# Open Chrome DevTools: http://localhost:3000
# React Developer Tools extension recommended

# Mobile debugging
# iOS: Use Safari Web Inspector
# Android: Use Chrome DevTools at chrome://inspect
```

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
```bash
# Clone all repositories
git clone https://github.com/tasklink-sa/tasklink-sa-backend.git
git clone https://github.com/tasklink-sa/tasklink-sa-frontend.git
git clone https://github.com/tasklink-sa/TaskLinkSAMobile.git

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Containers
```bash
# Backend
cd tasklink-sa-backend
docker build -t tasklink-backend .
docker run -p 3001:3001 tasklink-backend

# Frontend
cd tasklink-sa-frontend
docker build -t tasklink-frontend .
docker run -p 3000:3000 tasklink-frontend
```

## 🔐 Security Setup

### SSL Certificates (Development)
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use in development
NODE_ENV=development SSL_KEY_PATH=./key.pem SSL_CERT_PATH=./cert.pem npm run dev
```

### Environment Security
```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use different secrets for each environment
# Development: simple secrets
# Staging: more secure secrets
# Production: highly secure, rotated secrets
```

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "tasklink-backend"

# Or use Docker
docker build -t tasklink-backend .
docker run -d -p 3001:3001 tasklink-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to static hosting (Netlify, Vercel, etc.)
# Or serve with nginx/apache
```

### Mobile App Deployment
```bash
# Build for iOS
npm run ios:build

# Build for Android
npm run android:build

# Submit to app stores
# iOS: Upload to App Store Connect
# Android: Upload to Google Play Console
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Backend unit tests
npm run test:unit

# Frontend unit tests
npm test -- --testPathPattern=unit

# Mobile unit tests
npm run test:unit
```

### Integration Tests
```bash
# Backend integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Performance Testing
```bash
# Load testing with Artillery
npm install -g artillery
artillery run performance-tests.yml

# API performance testing
npm run test:performance
```

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 reloadLogs

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### Error Tracking
```bash
# Use Sentry for error tracking
npm install @sentry/node @sentry/react @sentry/react-native

# Configure in your application
# Follow Sentry documentation for setup
```

## 🤝 Contributing

### Development Guidelines
1. **Branch Naming**: `feature/feature-name` or `fix/bug-description`
2. **Commit Messages**: Use conventional commits
3. **Code Reviews**: All PRs require review
4. **Testing**: Maintain test coverage above 80%

### Pull Request Process
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

## 🆘 Troubleshooting

### Common Backend Issues
```bash
# Database connection issues
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
psql -h localhost -U username -d tasklink_sa_dev

# Port already in use
lsof -i :3001
kill -9 <PID>

# Prisma issues
npx prisma generate
npx prisma migrate deploy
```

### Common Frontend Issues
```bash
# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Port conflicts
npm start -- --port 3001

# CORS issues
# Check CORS_ORIGIN in backend .env
```

### Common Mobile Issues
```bash
# Metro bundler issues
npm start -- --reset-cache

# iOS build issues
cd ios && pod install && cd ..
npm run ios -- --simulator="iPhone 14"

# Android build issues
cd android && ./gradlew clean && cd ..
npm run android
```

## 📞 Support

### Development Support
- **Documentation**: [docs.tasklink.co.za/developer](https://docs.tasklink.co.za/developer)
- **GitHub Issues**: Report bugs and request features
- **Developer Forum**: [community.tasklink.co.za](https://community.tasklink.co.za)
- **Email**: developers@tasklink.co.za

### System Status
- **Status Page**: [status.tasklink.co.za](https://status.tasklink.co.za)
- **API Health**: [api.tasklink.co.za/health](https://api.tasklink.co.za/health)

---

**Need help?** Check the troubleshooting section or contact developer support. Happy coding! 🚀