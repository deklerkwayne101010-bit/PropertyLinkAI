# TaskLink SA API Overview

Welcome to the TaskLink SA API documentation. This RESTful API provides programmatic access to all TaskLink SA platform features, enabling developers to build integrations, mobile apps, and custom solutions.

## 🚀 Quick Start

### Base URL
```
https://api.tasklink.co.za/v1
```

### Authentication
All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Content Type
All requests should use JSON content type:

```
Content-Type: application/json
```

## 🔐 Authentication

### Login
Obtain a JWT token by logging in with user credentials.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CLIENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

### Register
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+27123456789",
  "role": "CLIENT"
}
```

### Token Refresh
Refresh an expired JWT token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

## 📋 Request/Response Format

### Successful Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

### Pagination
List endpoints support pagination:

**Request:**
```
GET /jobs?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## ⚡ Rate Limiting

API requests are rate limited to ensure fair usage:

### Limits
- **Authenticated requests:** 1000 requests per hour
- **Unauthenticated requests:** 100 requests per hour
- **Login attempts:** 5 attempts per 15 minutes per IP

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

## 🛡️ Security

### HTTPS Only
All API communication must use HTTPS. HTTP requests will be redirected to HTTPS.

### Input Validation
All input is validated server-side. Invalid requests return detailed validation errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### CORS Policy
CORS is enabled for web applications. Mobile apps should not encounter CORS issues.

## 📊 Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "bio": "string",
  "location": "string",
  "coordinates": {
    "lat": "number",
    "lng": "number"
  },
  "skills": ["string"],
  "rating": "number",
  "reviewCount": "number",
  "isVerified": "boolean",
  "role": "CLIENT | WORKER | ADMIN",
  "isWorker": "boolean",
  "isClient": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Job
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "location": "string",
  "coordinates": {
    "lat": "number",
    "lng": "number"
  },
  "budget": "number",
  "budgetType": "fixed | hourly",
  "status": "DRAFT | OPEN | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED",
  "posterId": "string",
  "workerId": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Payment
```json
{
  "id": "string",
  "amount": "number",
  "currency": "ZAR",
  "status": "PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED",
  "paymentMethod": "card | eft | paypal",
  "jobId": "string",
  "clientId": "string",
  "workerId": "string",
  "fee": "number",
  "netAmount": "number",
  "createdAt": "date"
}
```

## 🚨 Error Codes

### Authentication Errors
- `INVALID_CREDENTIALS`: Email or password incorrect
- `ACCOUNT_SUSPENDED`: User account is suspended
- `TOKEN_EXPIRED`: JWT token has expired
- `TOKEN_INVALID`: JWT token is malformed
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

### Validation Errors
- `VALIDATION_ERROR`: Input validation failed
- `REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Field format is incorrect
- `DUPLICATE_VALUE`: Value already exists

### Business Logic Errors
- `JOB_NOT_FOUND`: Specified job does not exist
- `INSUFFICIENT_FUNDS`: Account has insufficient funds
- `PAYMENT_FAILED`: Payment processing failed
- `DISPUTE_ACTIVE`: Job has an active dispute

### System Errors
- `INTERNAL_ERROR`: Unexpected server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `DATABASE_ERROR`: Database operation failed

## 🔗 Webhooks

TaskLink SA supports webhooks for real-time notifications:

### Supported Events
- `job.created`: New job posted
- `job.assigned`: Job assigned to worker
- `job.completed`: Job marked as completed
- `payment.completed`: Payment processed successfully
- `payment.failed`: Payment processing failed
- `dispute.created`: New dispute filed

### Webhook Payload
```json
{
  "event": "job.created",
  "data": {
    "job": {
      "id": "job_id",
      "title": "Job Title",
      // ... full job object
    }
  },
  "timestamp": "2025-10-07T07:35:30.000Z",
  "signature": "webhook_signature"
}
```

## 🧪 Testing

### Sandbox Environment
Test your integration in our sandbox environment:

**Base URL:** `https://api-sandbox.tasklink.co.za/v1`

### Test Data
Use these test credentials for sandbox testing:
- **Email:** test@example.com
- **Password:** testpassword123

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

### Jobs
- `GET /jobs` - List jobs with filtering
- `POST /jobs` - Create new job
- `GET /jobs/{id}` - Get job details
- `PUT /jobs/{id}` - Update job
- `DELETE /jobs/{id}` - Delete job
- `GET /jobs/nearby` - Find nearby jobs

### Applications
- `POST /jobs/{id}/applications` - Apply for job
- `GET /jobs/{id}/applications` - Get job applications
- `PUT /applications/{id}` - Update application
- `POST /applications/{id}/accept` - Accept application
- `POST /applications/{id}/reject` - Reject application

### Payments
- `POST /payments` - Create payment
- `GET /payments/{id}` - Get payment details
- `GET /payments` - List user payments
- `POST /payments/{id}/refund` - Request refund

### Messages
- `GET /messages` - Get user messages
- `POST /messages` - Send message
- `PUT /messages/{id}/read` - Mark message as read

### Reviews
- `POST /reviews` - Create review
- `GET /reviews/{id}` - Get review details
- `PUT /reviews/{id}` - Update review

## 🆘 Support

### Developer Support
- **Email:** developers@tasklink.co.za
- **Documentation:** [docs.tasklink.co.za](https://docs.tasklink.co.za)
- **Status Page:** [status.tasklink.co.za](https://status.tasklink.co.za)

### API Issues
- **Rate Limiting:** Check rate limit headers
- **Authentication:** Verify JWT token validity
- **CORS Issues:** Ensure proper headers
- **Timeouts:** Implement retry logic with exponential backoff

---

**Need help?** Check our detailed endpoint documentation or contact developer support.

*API Version: v1.0.0 | Last updated: October 2025*