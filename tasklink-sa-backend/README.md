# TaskLink SA Backend

A comprehensive backend API for TaskLink SA, a local task and odd job marketplace specifically designed for South Africa.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Job Marketplace**: Post jobs, browse tasks, apply for work
- **Real-time Communication**: Socket.io integration for instant messaging
- **Payment Processing**: PayFast and Stripe integration for South African payments
- **Location Services**: Google Maps API integration for location-based services
- **File Management**: AWS S3 integration for image/file storage
- **Review System**: Rating and review system for users and jobs
- **Notification System**: Real-time notifications and email alerts
- **Audit Logging**: Comprehensive audit trail for compliance
- **Admin Panel**: Administrative features for platform management

## 🛠 Technology Stack

### Core Technologies
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web application framework
- **Socket.io** - Real-time communication

### Database & ORM
- **PostgreSQL** - Robust relational database
- **Prisma ORM** - Type-safe database access

### External Services
- **PayFast** - South African payment gateway
- **Stripe** - Alternative payment processing
- **AWS S3** - File storage and management
- **Google Maps API** - Location services
- **Redis** - Caching and session storage

### Security & Performance
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Input Validation** - Joi and express-validator

## 📁 Project Structure

```
tasklink-sa-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client setup
│   │   └── index.ts      # Environment configuration
│   ├── controllers/      # Request handlers
│   │   └── auth.ts       # Authentication controllers
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── rateLimit.ts  # Rate limiting
│   │   ├── security.ts   # Security headers
│   │   └── validation.ts # Input validation
│   ├── routes/           # API routes
│   │   ├── auth.ts       # Authentication routes
│   │   ├── user.ts       # User management routes
│   │   ├── job.ts        # Job marketplace routes
│   │   ├── application.ts # Job application routes
│   │   ├── payment.ts    # Payment processing routes
│   │   ├── message.ts    # Messaging routes
│   │   ├── notification.ts # Notification routes
│   │   └── review.ts     # Review system routes
│   ├── services/         # Business logic
│   │   └── auth.ts       # Authentication services
│   ├── socket/           # Socket.io handlers
│   │   └── handlers.ts   # Real-time communication
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tasklink-sa-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # (Optional) Open Prisma Studio
   npm run prisma:studio
   ```

5. **Start the development server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Or using nodemon
   npm run dev:watch

   # Production build
   npm run build
   npm start
   ```

The server will start on `http://localhost:3001` by default.

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

### Job Marketplace Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create new job |
| GET | `/api/jobs/:id` | Get job details |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |

### User Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/verify` | Verify user account |

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tasklink_sa_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# PayFast (South African payments)
PAYFAST_MERCHANT_ID="your-merchant-id"
PAYFAST_MERCHANT_KEY="your-merchant-key"
PAYFAST_PASSPHRASE="your-passphrase"

# AWS S3 (File storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"

# Google Maps API
GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

See `.env.example` for a complete list of configuration options.

## 🗄 Database Schema

The database schema includes the following main entities:

- **Users**: User accounts with profiles, skills, and verification status
- **Jobs**: Task/job postings with categories, budgets, and requirements
- **Applications**: Job applications from workers
- **Payments**: Payment transactions with PayFast/Stripe integration
- **Reviews**: Rating and review system
- **Messages**: Real-time messaging between users
- **Notifications**: In-app and email notifications
- **AuditLog**: Comprehensive audit trail for compliance

## 💳 Payment Integration

### PayFast Integration

The platform integrates with PayFast for South African payment processing:

- **ZAR Currency Support**: Native South African Rand support
- **Local Payment Methods**: EFT, Credit Cards, Instant EFT
- **ITPP (Instant Transfer Pay Processing)**: Real-time payment confirmation
- **Security**: PCI DSS compliant

### Stripe Integration

Alternative payment processing with Stripe:

- **Global Support**: International payment methods
- **Webhooks**: Real-time payment notifications
- **Subscriptions**: Recurring payment support

## 🌍 Location Services

### Google Maps Integration

- **Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Distance Calculation**: Calculate distances between locations
- **Location-based Search**: Find jobs/workers by location

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js security headers
- **Audit Logging**: Complete audit trail

## 📡 Real-time Features

### Socket.io Integration

- **Real-time Messaging**: Instant communication between users
- **Live Notifications**: Real-time notification delivery
- **Job Updates**: Live job status updates
- **User Status**: Online/offline status indicators

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   # Configure production database URL
   # Set up production Redis instance
   # Configure production payment gateways
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Morgan**: HTTP request logging
- **Health Check Endpoint**: `/health` for monitoring
- **Performance Metrics**: Response time tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@tasklinksa.co.za
- Phone: +27 11 123 4567

## 🔄 API Versioning

Current API Version: v1
Base URL: `/api/v1`

Future versions will be available at:
- v2: `/api/v2`
- v3: `/api/v3`

## 📋 Changelog

### Version 1.0.0
- Initial release
- Complete backend structure setup
- Database schema implementation
- Authentication system foundation
- Payment integration setup
- Real-time communication setup

---

**TaskLink SA** - Connecting South Africans with local tasks and opportunities.