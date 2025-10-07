# Real Estate AI Backend

A Node.js backend API for a Real Estate AI application with Express, PostgreSQL, JWT authentication, and GDPR compliance features.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: User registration, login, and profile management
- **Property Management**: CRUD operations for real estate properties
- **AI Integration Ready**: Prepared for AI content generation
- **GDPR Compliance**: Data processing logs and user consent management
- **Security**: Helmet, CORS, rate limiting, input validation
- **TypeScript**: Full TypeScript support with strict type checking

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, express-rate-limit

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone and install dependencies**:
   ```bash
   cd real-estate-ai-backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/real_estate_ai"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run database migrations
   npm run db:migrate

   # (Optional) Seed the database
   npm run db:seed
   ```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

### Properties
- `GET /api/properties` - List user properties
- `POST /api/properties` - Create new property
- `GET /api/properties/history` - Get property history

### Market Data
- `GET /api/market-data/:location` - Get market data for location

### GDPR Compliance
- `POST /api/gdpr/consent` - Record user consent
- `DELETE /api/gdpr/data` - Delete user data (GDPR right to erasure)

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Prisma client setup
│   ├── jwt.ts       # JWT configuration
│   └── index.ts     # Main configuration
├── controllers/      # Route controllers
│   ├── auth.ts      # Authentication logic
│   └── user.ts      # User management logic
├── middleware/       # Express middleware
│   ├── auth.ts      # JWT authentication
│   ├── validation.ts # Input validation
│   ├── errorHandler.ts # Error handling
│   └── gdprLogger.ts # GDPR compliance logging
├── routes/          # API routes
│   ├── auth.ts      # Authentication routes
│   ├── user.ts      # User routes
│   ├── property.ts  # Property routes
│   ├── marketData.ts # Market data routes
│   └── gdpr.ts      # GDPR routes
├── services/        # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Main application entry point
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Access and refresh tokens
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable origins
- **Security Headers**: Helmet middleware
- **GDPR Logging**: Data processing activity logs

## Database Schema

The application uses the following main entities:

- **Users**: User accounts with subscription tiers
- **Properties**: Real estate property listings
- **GeneratedContent**: AI-generated content for properties
- **AIUsage**: AI API usage tracking
- **ContentTemplates**: Reusable prompt templates
- **UserConsent**: GDPR consent records
- **DataProcessingLog**: GDPR compliance logs

## Development Guidelines

1. **Code Style**: Follow ESLint configuration
2. **TypeScript**: Use strict type checking
3. **Error Handling**: Use proper error responses
4. **Validation**: Validate all inputs
5. **Security**: Follow security best practices
6. **GDPR**: Log all data processing activities

## Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   ```env
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=your_production_jwt_secret
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure GDPR compliance
5. Test thoroughly before deployment

## License

MIT License - see LICENSE file for details.