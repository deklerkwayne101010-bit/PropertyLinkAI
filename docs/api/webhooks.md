# Webhooks

TaskLink SA uses webhooks to provide real-time notifications about platform events. Webhooks allow your application to receive instant updates without polling the API.

## Overview

Webhooks are HTTP POST requests sent to URLs you configure. Each webhook contains JSON data about the event that occurred.

### Security
- All webhooks include a signature for verification
- HTTPS is required for webhook endpoints
- Failed deliveries are retried with exponential backoff
- Webhook logs are available in your dashboard

## Configuration

### Setting Up Webhooks

1. **Access Settings**: Go to your developer dashboard
2. **Add Endpoint**: Provide your webhook URL
3. **Select Events**: Choose which events to receive
4. **Test Webhook**: Send a test event to verify setup

### Webhook URL Requirements
- Must use HTTPS
- Must respond within 10 seconds
- Must return 2xx status code for successful delivery
- Should handle duplicate events gracefully

## Event Types

### Job Events

#### job.created
Triggered when a new job is posted.

```json
{
  "event": "job.created",
  "id": "evt_123456",
  "timestamp": "2025-10-07T07:37:03.000Z",
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "description": "Need someone to maintain my garden weekly...",
      "category": "gardening",
      "location": "Cape Town, Western Cape",
      "budget": 500.00,
      "budgetType": "fixed",
      "status": "OPEN",
      "posterId": "user_123",
      "createdAt": "2025-10-07T07:37:03.000Z"
    }
  },
  "signature": "sha256=abc123def456..."
}
```

#### job.updated
Triggered when job details are modified.

```json
{
  "event": "job.updated",
  "id": "evt_123457",
  "timestamp": "2025-10-07T08:00:00.000Z",
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Updated Garden Maintenance Service",
      "budget": 550.00,
      "updatedAt": "2025-10-07T08:00:00.000Z"
    },
    "changes": {
      "budget": {
        "from": 500.00,
        "to": 550.00
      }
    }
  },
  "signature": "sha256=def789ghi012..."
}
```

#### job.assigned
Triggered when a worker is assigned to a job.

```json
{
  "event": "job.assigned",
  "id": "evt_123458",
  "timestamp": "2025-10-07T09:00:00.000Z",
  "data": {
    "job": {
      "id": "job_123456",
      "workerId": "user_456",
      "status": "ASSIGNED",
      "assignedAt": "2025-10-07T09:00:00.000Z"
    },
    "worker": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith",
      "rating": 4.9
    }
  },
  "signature": "sha256=ghi345jkl678..."
}
```

#### job.completed
Triggered when a job is marked as completed.

```json
{
  "event": "job.completed",
  "id": "evt_123459",
  "timestamp": "2025-10-07T17:00:00.000Z",
  "data": {
    "job": {
      "id": "job_123456",
      "status": "COMPLETED",
      "completedAt": "2025-10-07T17:00:00.000Z"
    },
    "completion": {
      "rating": 5,
      "review": "Excellent work, very professional",
      "paymentReleased": true
    }
  },
  "signature": "sha256=jkl901mno234..."
}
```

### Payment Events

#### payment.created
Triggered when a payment is initiated.

```json
{
  "event": "payment.created",
  "id": "evt_123460",
  "timestamp": "2025-10-07T10:00:00.000Z",
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 500.00,
      "currency": "ZAR",
      "status": "PENDING",
      "paymentMethod": "payfast",
      "jobId": "job_123456",
      "clientId": "user_123",
      "workerId": "user_456",
      "fee": 50.00,
      "netAmount": 450.00
    }
  },
  "signature": "sha256=mno567pqr890..."
}
```

#### payment.completed
Triggered when a payment is successfully processed.

```json
{
  "event": "payment.completed",
  "id": "evt_123461",
  "timestamp": "2025-10-07T10:30:00.000Z",
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 500.00,
      "status": "COMPLETED",
      "paidAt": "2025-10-07T10:30:00.000Z",
      "transactionId": "pf_789123"
    },
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service"
    }
  },
  "signature": "sha256=pqr123stu456..."
}
```

#### payment.failed
Triggered when a payment fails or is rejected.

```json
{
  "event": "payment.failed",
  "id": "evt_123462",
  "timestamp": "2025-10-07T10:15:00.000Z",
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 500.00,
      "status": "FAILED",
      "failureReason": "Insufficient funds",
      "failedAt": "2025-10-07T10:15:00.000Z"
    },
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service"
    }
  },
  "signature": "sha256=stu789vwx012..."
}
```

#### payment.refunded
Triggered when a payment is refunded.

```json
{
  "event": "payment.refunded",
  "id": "evt_123463",
  "timestamp": "2025-10-07T14:00:00.000Z",
  "data": {
    "payment": {
      "id": "pay_123456",
      "amount": 250.00,
      "status": "REFUNDED",
      "refundedAt": "2025-10-07T14:00:00.000Z",
      "refundReason": "Job cancelled by client"
    },
    "originalPayment": {
      "id": "pay_123455",
      "amount": 500.00
    }
  },
  "signature": "sha256=vwx345yza678..."
}
```

### Application Events

#### application.submitted
Triggered when a worker applies for a job.

```json
{
  "event": "application.submitted",
  "id": "evt_123464",
  "timestamp": "2025-10-07T11:00:00.000Z",
  "data": {
    "application": {
      "id": "app_123456",
      "jobId": "job_123456",
      "applicantId": "user_456",
      "message": "I have 5 years experience in garden maintenance",
      "proposedRate": 450.00,
      "status": "PENDING"
    },
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "budget": 500.00
    },
    "applicant": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith",
      "rating": 4.9,
      "skills": ["gardening", "landscaping"]
    }
  },
  "signature": "sha256=yza901bcd234..."
}
```

#### application.accepted
Triggered when a job application is accepted.

```json
{
  "event": "application.accepted",
  "id": "evt_123465",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "data": {
    "application": {
      "id": "app_123456",
      "status": "ACCEPTED",
      "acceptedAt": "2025-10-07T12:00:00.000Z"
    },
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "workerId": "user_456"
    },
    "worker": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  },
  "signature": "sha256=bcd567efg890..."
}
```

### Review Events

#### review.created
Triggered when a review is submitted.

```json
{
  "event": "review.created",
  "id": "evt_123466",
  "timestamp": "2025-10-07T18:00:00.000Z",
  "data": {
    "review": {
      "id": "rev_123456",
      "rating": 5,
      "comment": "Excellent work, very professional and punctual",
      "jobId": "job_123456",
      "reviewerId": "user_123",
      "revieweeId": "user_456",
      "isPublic": true,
      "createdAt": "2025-10-07T18:00:00.000Z"
    },
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service"
    }
  },
  "signature": "sha256=efg123hij456..."
}
```

### Dispute Events

#### dispute.created
Triggered when a dispute is filed.

```json
{
  "event": "dispute.created",
  "id": "evt_123467",
  "timestamp": "2025-10-07T19:00:00.000Z",
  "data": {
    "dispute": {
      "id": "dsp_123456",
      "title": "Work not completed satisfactorily",
      "description": "The garden maintenance was incomplete...",
      "status": "OPEN",
      "priority": "MEDIUM",
      "category": "job_quality",
      "reporterId": "user_123",
      "reportedUserId": "user_456",
      "jobId": "job_123456",
      "createdAt": "2025-10-07T19:00:00.000Z"
    }
  },
  "signature": "sha256=hij789klm012..."
}
```

#### dispute.resolved
Triggered when a dispute is resolved.

```json
{
  "event": "dispute.resolved",
  "id": "evt_123468",
  "timestamp": "2025-10-08T10:00:00.000Z",
  "data": {
    "dispute": {
      "id": "dsp_123456",
      "status": "RESOLVED",
      "resolution": "Worker agreed to complete remaining work",
      "resolvedAt": "2025-10-08T10:00:00.000Z"
    },
    "outcome": {
      "refundAmount": 0,
      "additionalPayment": 0,
      "jobStatus": "COMPLETED"
    }
  },
  "signature": "sha256=klm345nop678..."
}
```

## Webhook Headers

Every webhook includes the following headers:

```
Content-Type: application/json
User-Agent: TaskLink-SA-Webhook/1.0
X-Webhook-ID: evt_123456
X-Webhook-Signature: sha256=abc123def456...
X-Webhook-Attempt: 1
X-Webhook-Event: job.created
```

## Signature Verification

### How to Verify Signatures

1. **Extract Signature**: Get the `X-Webhook-Signature` header
2. **Prepare Data**: Create string from `X-Webhook-ID` + request body
3. **Compute HMAC**: Use SHA256 HMAC with your webhook secret
4. **Compare**: Verify the computed signature matches the header

### Example Verification (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-webhook-signature'];
  const webhookId = req.headers['x-webhook-id'];
  const body = JSON.stringify(req.body);

  const payload = webhookId + body;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}
```

### Example Verification (Python)
```python
import hmac
import hashlib
import json

def verify_webhook(request, secret):
    signature = request.headers.get('X-Webhook-Signature')
    webhook_id = request.headers.get('X-Webhook-ID')
    body = json.dumps(request.json, separators=(',', ':'))

    payload = webhook_id + body
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    received_signature = signature.replace('sha256=', '')

    return hmac.compare_digest(expected_signature, received_signature)
```

## Delivery & Retry Logic

### Successful Delivery
- Returns HTTP 2xx status code within 10 seconds
- Webhook is marked as delivered
- No further attempts made

### Failed Delivery
- Returns non-2xx status code or times out
- Automatic retry with exponential backoff
- Up to 5 retry attempts over 24 hours

### Retry Schedule
- Attempt 1: Immediate
- Attempt 2: 5 minutes later
- Attempt 3: 30 minutes later
- Attempt 4: 2 hours later
- Attempt 5: 12 hours later

### Manual Retry
Failed webhooks can be manually retried from your dashboard.

## Best Practices

### Handling Webhooks

1. **Idempotency**: Handle duplicate events gracefully using event IDs
2. **Order Independence**: Don't assume webhook delivery order
3. **Timeout Handling**: Respond quickly, process asynchronously
4. **Logging**: Log all webhook attempts for debugging
5. **Security**: Always verify signatures before processing

### Error Handling

```javascript
app.post('/webhooks/tasklink', (req, res) => {
  try {
    // Verify signature
    if (!verifyWebhook(req, WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }

    // Check for duplicate events
    const eventId = req.headers['x-webhook-id'];
    if (await isEventProcessed(eventId)) {
      return res.status(200).send('Event already processed');
    }

    // Process webhook asynchronously
    processWebhookAsync(req.body);

    // Respond immediately
    res.status(200).send('Webhook received');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal server error');
  }
});
```

### Testing Webhooks

1. **Use HTTPS URL**: ngrok or similar for local testing
2. **Test Events**: Send test events from dashboard
3. **Monitor Logs**: Check webhook delivery logs
4. **Handle Failures**: Test retry logic with failing endpoints

## Webhook Logs

### Accessing Logs
- View in developer dashboard
- See delivery status and timestamps
- Access payload and response data
- Filter by event type and date

### Log Retention
- Successful deliveries: 30 days
- Failed deliveries: 90 days
- Manually triggered retries: 30 days

## Rate Limits

### Webhook Delivery
- No rate limits on webhook delivery
- Failed webhooks are queued and retried
- High-volume events may be batched

### API Rate Limits
- Webhook configuration: 10 requests per minute
- Test webhook sending: 5 requests per minute

## Troubleshooting

### Common Issues

#### Signature Verification Fails
- Check webhook secret is correct
- Ensure raw request body is used
- Verify HMAC implementation

#### Webhooks Not Delivering
- Confirm HTTPS URL is accessible
- Check firewall and security settings
- Verify endpoint responds within 10 seconds

#### Duplicate Events
- Implement idempotency using event IDs
- Store processed event IDs in database
- Handle race conditions gracefully

#### Events Out of Order
- Don't rely on webhook delivery order
- Use event timestamps for sequencing
- Implement reconciliation logic

### Support
For webhook issues:
- Check webhook logs in dashboard
- Review delivery status and error messages
- Contact developers@tasklink.co.za
- Include webhook ID and timestamps in support requests