# Authentication API

The Authentication API handles user registration, login, token management, and password operations for TaskLink SA.

## Register User

Create a new user account on the platform.

**Endpoint:** `POST /auth/register`

**Authentication:** Not required

**Rate Limit:** 5 requests per 15 minutes per IP

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+27123456789",
  "role": "CLIENT"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | 8+ characters with mixed case, numbers, symbols |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| phone | string | Yes | South African phone number with country code |
| role | string | Yes | Either "CLIENT", "WORKER", or "BOTH" |

### Success Response (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+27123456789",
      "role": "CLIENT",
      "isVerified": false,
      "createdAt": "2025-10-07T07:35:56.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "User registered successfully. Please verify your email."
}
```

### Error Responses
- `400 VALIDATION_ERROR`: Invalid input data
- `409 DUPLICATE_EMAIL`: Email already registered
- `429 RATE_LIMIT_EXCEEDED`: Too many registration attempts

## Login User

Authenticate user credentials and obtain JWT tokens.

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Rate Limit:** 5 attempts per 15 minutes per IP

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |
| password | string | Yes | User's password |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CLIENT",
      "isVerified": true,
      "lastLoginAt": "2025-10-07T07:35:56.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

### Error Responses
- `401 INVALID_CREDENTIALS`: Email or password incorrect
- `403 ACCOUNT_SUSPENDED`: User account is suspended
- `429 RATE_LIMIT_EXCEEDED`: Too many login attempts

## Refresh Token

Obtain a new JWT token using a refresh token.

**Endpoint:** `POST /auth/refresh`

**Authentication:** Not required

**Rate Limit:** 10 requests per minute

### Request Body
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token from login |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

### Error Responses
- `401 TOKEN_INVALID`: Invalid or expired refresh token

## Logout User

Invalidate the current JWT token (client-side token removal recommended).

**Endpoint:** `POST /auth/logout`

**Authentication:** Required (JWT token)

**Rate Limit:** 10 requests per minute

### Request Body
```json
{}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Get Current User

Retrieve the authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (JWT token)

**Rate Limit:** 60 requests per minute

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+27123456789",
      "bio": "Experienced handyman with 10+ years",
      "location": "Cape Town, Western Cape",
      "coordinates": {
        "lat": -33.9249,
        "lng": 18.4241
      },
      "skills": ["plumbing", "electrical", "carpentry"],
      "rating": 4.8,
      "reviewCount": 25,
      "isVerified": true,
      "role": "WORKER",
      "isWorker": true,
      "isClient": false,
      "completedJobs": 23,
      "totalEarned": 45000.00,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-10-07T07:35:56.000Z"
    }
  }
}
```

## Forgot Password

Initiate password reset process.

**Endpoint:** `POST /auth/forgot-password`

**Authentication:** Not required

**Rate Limit:** 3 requests per hour per email

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |

### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

### Error Responses
- `404 USER_NOT_FOUND`: Email not registered
- `429 RATE_LIMIT_EXCEEDED`: Too many reset requests

## Reset Password

Complete password reset using token from email.

**Endpoint:** `POST /auth/reset-password`

**Authentication:** Not required

**Rate Limit:** 5 attempts per hour per token

### Request Body
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Reset token from email |
| password | string | Yes | New password (8+ characters) |
| confirmPassword | string | Yes | Password confirmation |

### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Error Responses
- `400 INVALID_TOKEN`: Token expired or invalid
- `400 PASSWORD_MISMATCH`: Passwords don't match
- `429 RATE_LIMIT_EXCEEDED`: Too many reset attempts

## Verify Email

Verify user email address using verification token.

**Endpoint:** `GET /auth/verify-email`

**Authentication:** Not required

**Rate Limit:** 10 requests per minute

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Email verification token |

### Success Response (200)
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Error Responses
- `400 INVALID_TOKEN`: Token expired or invalid

## Change Password

Change password for authenticated user.

**Endpoint:** `POST /auth/change-password`

**Authentication:** Required (JWT token)

**Rate Limit:** 5 attempts per hour

### Request Body
```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | Current password |
| newPassword | string | Yes | New password (8+ characters) |
| confirmPassword | string | Yes | Password confirmation |

### Success Response (200)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Responses
- `401 INVALID_CREDENTIALS`: Current password incorrect
- `400 PASSWORD_MISMATCH`: New passwords don't match
- `429 RATE_LIMIT_EXCEEDED`: Too many password changes

## Resend Verification Email

Resend email verification link.

**Endpoint:** `POST /auth/resend-verification`

**Authentication:** Required (JWT token)

**Rate Limit:** 3 requests per hour

### Success Response (200)
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

## Authentication Flow Examples

### Complete Registration Flow
```javascript
// 1. Register user
const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+27123456789',
    role: 'CLIENT'
  })
});

// 2. Store tokens
const { token, refreshToken } = await registerResponse.json();

// 3. Use token for authenticated requests
const profileResponse = await fetch('/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Token Refresh Flow
```javascript
// Check if token is expired and refresh
const refreshResponse = await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: storedRefreshToken
  })
});

const { token: newToken, refreshToken: newRefreshToken } = await refreshResponse.json();
// Update stored tokens
```

## Security Best Practices

1. **Token Storage**: Store tokens securely (httpOnly cookies for web, Keychain for mobile)
2. **Token Refresh**: Implement automatic token refresh before expiration
3. **Logout**: Always call logout endpoint and clear stored tokens
4. **Password Requirements**: Enforce strong password policies
5. **Rate Limiting**: Respect API rate limits to avoid blocks
6. **HTTPS Only**: Always use HTTPS for all API calls