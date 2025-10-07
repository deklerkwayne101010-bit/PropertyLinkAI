# Payments API

The Payments API handles all payment processing, escrow management, and financial transactions on TaskLink SA using PayFast integration.

## Create Job Payment

Initiate payment for a job (client deposits funds into escrow).

**Endpoint:** `POST /payments`

**Authentication:** Required (Client only)

**Rate Limit:** 10 requests per minute

### Request Body
```json
{
  "jobId": "job_123456",
  "amount": 500.00,
  "paymentMethod": "payfast"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobId | string | Yes | Job ID to pay for |
| amount | number | Yes | Payment amount in ZAR |
| paymentMethod | string | No | Payment method ("payfast", "eft", "card") |

### Success Response (201)
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 500.00,
      "currency": "ZAR",
      "status": "PENDING",
      "paymentMethod": "payfast",
      "payfastId": "pf_789123",
      "jobId": "job_123456",
      "clientId": "user_123",
      "workerId": "user_456",
      "fee": 50.00,
      "netAmount": 450.00,
      "createdAt": "2025-10-07T07:36:39.000Z"
    },
    "paymentUrl": "https://www.payfast.co.za/eng/process?..."
  }
}
```

### Error Responses
- `400 VALIDATION_ERROR`: Invalid payment data
- `403 FORBIDDEN`: User is not the job client
- `409 CONFLICT`: Payment already exists for job

## Get Payment Details

Retrieve information about a specific payment.

**Endpoint:** `GET /payments/{id}`

**Authentication:** Required (Payment participant only)

**Rate Limit:** 60 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment ID |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 500.00,
      "currency": "ZAR",
      "status": "COMPLETED",
      "paymentMethod": "payfast",
      "payfastId": "pf_789123",
      "jobId": "job_123456",
      "clientId": "user_123",
      "workerId": "user_456",
      "fee": 50.00,
      "netAmount": 450.00,
      "paidAt": "2025-10-07T08:00:00.000Z",
      "createdAt": "2025-10-07T07:36:39.000Z",
      "updatedAt": "2025-10-07T08:00:00.000Z"
    }
  }
}
```

### Error Responses
- `404 NOT_FOUND`: Payment not found
- `403 FORBIDDEN`: User not authorized to view payment

## Get Job Payments

Retrieve all payments for a specific job.

**Endpoint:** `GET /payments/jobs/{jobId}`

**Authentication:** Required (Job participant only)

**Rate Limit:** 30 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| jobId | string | Yes | Job ID |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123456",
        "amount": 500.00,
        "status": "COMPLETED",
        "paymentMethod": "payfast",
        "fee": 50.00,
        "netAmount": 450.00,
        "paidAt": "2025-10-07T08:00:00.000Z",
        "createdAt": "2025-10-07T07:36:39.000Z"
      }
    ],
    "totalPaid": 500.00,
    "totalFees": 50.00
  }
}
```

## Update Payment Status

Update payment status (admin only).

**Endpoint:** `PUT /payments/{id}/status`

**Authentication:** Required (Admin only)

**Rate Limit:** 10 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment ID |

### Request Body
```json
{
  "status": "COMPLETED",
  "notes": "Payment processed successfully"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New payment status |
| notes | string | No | Admin notes |

### Success Response (200)
```json
{
  "success": true,
  "message": "Payment status updated",
  "data": {
    "payment": {
      "id": "pay_123456",
      "status": "COMPLETED",
      "updatedAt": "2025-10-07T08:30:00.000Z"
    }
  }
}
```

## Request Payment Refund

Request a refund for a payment.

**Endpoint:** `POST /payments/{id}/refund`

**Authentication:** Required (Payment participant)

**Rate Limit:** 5 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment ID |

### Request Body
```json
{
  "amount": 250.00,
  "reason": "Job cancelled due to unforeseen circumstances",
  "description": "Client requested cancellation before work began"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | Yes | Refund amount |
| reason | string | Yes | Reason for refund |
| description | string | No | Detailed description |

### Success Response (200)
```json
{
  "success": true,
  "message": "Refund request submitted",
  "data": {
    "refund": {
      "id": "ref_123456",
      "paymentId": "pay_123456",
      "amount": 250.00,
      "status": "PENDING",
      "reason": "Job cancelled due to unforeseen circumstances",
      "createdAt": "2025-10-07T09:00:00.000Z"
    }
  }
}
```

## Release Escrow Funds

Release funds from escrow to worker (admin only).

**Endpoint:** `POST /payments/{id}/release`

**Authentication:** Required (Admin only)

**Rate Limit:** 10 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment ID |

### Success Response (200)
```json
{
  "success": true,
  "message": "Escrow funds released to worker",
  "data": {
    "payment": {
      "id": "pay_123456",
      "status": "COMPLETED",
      "paidAt": "2025-10-07T09:30:00.000Z"
    }
  }
}
```

## Wallet Balance

Get user's wallet balance and transaction summary.

**Endpoint:** `GET /payments/wallet/balance`

**Authentication:** Required

**Rate Limit:** 30 requests per minute

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "balance": 2500.00,
    "available": 2200.00,
    "pending": 300.00,
    "currency": "ZAR",
    "lastUpdated": "2025-10-07T07:36:39.000Z"
  }
}
```

## Wallet Transactions

Get user's wallet transaction history.

**Endpoint:** `GET /payments/wallet/transactions`

**Authentication:** Required

**Rate Limit:** 30 requests per minute

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| type | string | all | Transaction type filter |
| startDate | string | - | Start date (ISO 8601) |
| endDate | string | - | End date (ISO 8601) |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123456",
        "type": "PAYMENT_RECEIVED",
        "amount": 450.00,
        "description": "Payment for Garden Maintenance Service",
        "jobId": "job_123456",
        "createdAt": "2025-10-07T08:00:00.000Z",
        "balance": 2650.00
      },
      {
        "id": "txn_123457",
        "type": "PLATFORM_FEE",
        "amount": -50.00,
        "description": "Platform fee for job completion",
        "jobId": "job_123456",
        "createdAt": "2025-10-07T08:00:00.000Z",
        "balance": 2200.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

## Request Withdrawal

Request withdrawal of funds to bank account.

**Endpoint:** `POST /payments/wallet/withdraw`

**Authentication:** Required (Workers only)

**Rate Limit:** 5 requests per minute

### Request Body
```json
{
  "amount": 1000.00,
  "bankAccount": {
    "accountHolder": "John Doe",
    "bankName": "FNB",
    "accountNumber": "12345678901",
    "branchCode": "250655"
  },
  "withdrawalMethod": "eft"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | Yes | Withdrawal amount (min R500) |
| bankAccount | object | Yes | Bank account details |
| withdrawalMethod | string | No | "eft" or "payfast" |

### Success Response (200)
```json
{
  "success": true,
  "message": "Withdrawal request submitted",
  "data": {
    "withdrawal": {
      "id": "wd_123456",
      "amount": 1000.00,
      "status": "PENDING",
      "method": "eft",
      "estimatedSettlement": "2025-10-09T00:00:00.000Z",
      "createdAt": "2025-10-07T10:00:00.000Z"
    }
  }
}
```

## Earnings Summary

Get detailed earnings information for workers.

**Endpoint:** `GET /payments/wallet/earnings`

**Authentication:** Required (Workers only)

**Rate Limit:** 30 requests per minute

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | month | "week", "month", "year", "all" |
| year | number | current | Year for filtering |
| month | number | current | Month for filtering |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEarned": 12500.00,
      "totalFees": 1250.00,
      "netEarnings": 11250.00,
      "jobsCompleted": 25,
      "averageRating": 4.7
    },
    "breakdown": {
      "thisMonth": {
        "earned": 2500.00,
        "jobs": 5,
        "averageJobValue": 500.00
      },
      "lastMonth": {
        "earned": 2200.00,
        "jobs": 4,
        "averageJobValue": 550.00
      }
    },
    "topCategories": [
      {
        "category": "gardening",
        "earned": 4500.00,
        "jobs": 9
      },
      {
        "category": "cleaning",
        "earned": 3800.00,
        "jobs": 8
      }
    ]
  }
}
```

## Admin Payment Management

Get all payments for admin oversight.

**Endpoint:** `GET /payments/admin/payments`

**Authentication:** Required (Admin only)

**Rate Limit:** 30 requests per minute

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Payment status filter |
| paymentMethod | string | Payment method filter |
| startDate | string | Start date filter |
| endDate | string | End date filter |
| page | number | Page number |
| limit | number | Items per page |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123456",
        "amount": 500.00,
        "status": "COMPLETED",
        "paymentMethod": "payfast",
        "clientId": "user_123",
        "workerId": "user_456",
        "jobId": "job_789",
        "paidAt": "2025-10-07T08:00:00.000Z",
        "createdAt": "2025-10-07T07:36:39.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

## Payment Analytics

Get payment analytics and insights.

**Endpoint:** `GET /payments/admin/analytics`

**Authentication:** Required (Admin only)

**Rate Limit:** 10 requests per minute

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | month | "week", "month", "quarter", "year" |
| startDate | string | - | Custom start date |
| endDate | string | - | Custom end date |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPayments": 1250,
      "totalVolume": 625000.00,
      "totalFees": 62500.00,
      "successRate": 98.5
    },
    "trends": {
      "daily": [
        {
          "date": "2025-10-07",
          "payments": 45,
          "volume": 22500.00
        }
      ],
      "monthly": [
        {
          "month": "2025-10",
          "payments": 1250,
          "volume": 625000.00
        }
      ]
    },
    "methods": {
      "payfast": {
        "count": 1000,
        "volume": 500000.00,
        "percentage": 80.0
      },
      "eft": {
        "count": 200,
        "volume": 100000.00,
        "percentage": 16.0
      },
      "card": {
        "count": 50,
        "volume": 25000.00,
        "percentage": 4.0
      }
    }
  }
}
```

## PayFast Webhook

Handle PayFast payment notifications.

**Endpoint:** `POST /payments/webhook`

**Authentication:** Not required (PayFast signature validation)

**Rate Limit:** No limit (webhook endpoint)

### Webhook Payload
```
merchant_id=10000100
merchant_key=46f0cd694581a
payment_id=123456
payment_status=COMPLETE
item_name=TaskLink SA Payment
amount_gross=500.00
amount_fee=-14.50
amount_net=485.50
custom_str1=pay_123456
custom_str2=job_789
signature=abc123def456
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Payment notification processed"
}
```

## Payment Statuses

- **PENDING**: Payment initiated, awaiting processing
- **PROCESSING**: Payment being processed by provider
- **COMPLETED**: Payment successful, funds available
- **FAILED**: Payment failed or rejected
- **REFUNDED**: Payment refunded to client
- **CANCELLED**: Payment cancelled before completion

## Transaction Types

- **PAYMENT_RECEIVED**: Worker received payment
- **PLATFORM_FEE**: Platform fee deduction
- **REFUND_PROCESSED**: Refund credited to account
- **WITHDRAWAL**: Funds withdrawn to bank
- **ESCROW_HOLD**: Funds placed in escrow
- **ESCROW_RELEASE**: Funds released from escrow

## Usage Examples

### Process Job Payment
```javascript
const paymentData = {
  jobId: "job_123456",
  amount: 500.00,
  paymentMethod: "payfast"
};

const response = await fetch('/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(paymentData)
});

const { paymentUrl } = await response.json();
// Redirect user to PayFast payment page
window.location.href = paymentUrl;
```

### Check Wallet Balance
```javascript
const response = await fetch('/payments/wallet/balance', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { balance, available } = await response.json();
console.log(`Available balance: R${available}`);
```

### Request Withdrawal
```javascript
const withdrawalData = {
  amount: 1000.00,
  bankAccount: {
    accountHolder: "John Doe",
    bankName: "FNB",
    accountNumber: "12345678901",
    branchCode: "250655"
  }
};

const response = await fetch('/payments/wallet/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(withdrawalData)
});