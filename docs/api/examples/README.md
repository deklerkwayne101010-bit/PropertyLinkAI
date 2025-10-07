# API Examples

This directory contains practical examples for integrating with the TaskLink SA API. Examples are provided in multiple programming languages and cover common use cases.

## 📁 Example Files

### Authentication Examples
- [auth.js](auth.js) - User registration, login, and token management
- [auth.py](auth.py) - Python authentication examples
- [auth.go](auth.go) - Go authentication examples

### Job Management Examples
- [jobs.js](jobs.js) - Creating, searching, and managing jobs
- [jobs.py](jobs.py) - Python job management examples
- [applications.js](applications.js) - Handling job applications

### Payment Integration Examples
- [payments.js](payments.js) - Payment processing and escrow management
- [webhooks.js](webhooks.js) - Handling webhook notifications
- [refunds.js](refunds.js) - Processing refunds and disputes

### Real-time Features
- [realtime.js](realtime.js) - Socket.io integration for messaging
- [notifications.js](notifications.js) - Push notification handling

## 🚀 Quick Start Examples

### JavaScript/Node.js

#### Complete User Registration Flow
```javascript
const TaskLinkAPI = require('./tasklink-api');

async function registerAndPostJob() {
  const api = new TaskLinkAPI();

  try {
    // Register new user
    const user = await api.register({
      email: 'contractor@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Contractor',
      phone: '+27123456789',
      role: 'WORKER'
    });

    console.log('User registered:', user.firstName);

    // Login to get token
    const auth = await api.login('contractor@example.com', 'SecurePass123!');
    console.log('Logged in, token:', auth.token.substring(0, 20) + '...');

    // Update profile with skills
    await api.updateProfile({
      bio: 'Experienced handyman with 10+ years',
      skills: ['plumbing', 'electrical', 'carpentry'],
      location: 'Cape Town, Western Cape'
    });

    // Search for available jobs
    const jobs = await api.searchJobs({
      category: 'handyman',
      location: 'Cape Town',
      minBudget: 500,
      maxBudget: 2000
    });

    if (jobs.length > 0) {
      // Apply for first job
      const application = await api.applyForJob(jobs[0].id, {
        message: 'I have extensive experience in handyman work...',
        proposedRate: 800
      });

      console.log('Applied for job:', jobs[0].title);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

registerAndPostJob();
```

#### Client Job Posting Flow
```javascript
const TaskLinkAPI = require('./tasklink-api');

async function postAndManageJob() {
  const api = new TaskLinkAPI();

  try {
    // Login as client
    await api.login('client@example.com', 'SecurePass123!');

    // Create new job
    const job = await api.createJob({
      title: 'House Cleaning Service',
      description: 'Need deep cleaning for 3-bedroom house, including kitchen and bathrooms',
      category: 'cleaning',
      location: 'Johannesburg, Gauteng',
      budget: 1200,
      budgetType: 'fixed',
      requirements: ['cleaning experience', 'own equipment'],
      images: ['https://example.com/house1.jpg']
    });

    console.log('Job created:', job.title);

    // Monitor applications
    setInterval(async () => {
      const applications = await api.getJobApplications(job.id);
      console.log(`Job has ${applications.length} applications`);

      // Accept first qualified application
      if (applications.length > 0) {
        const qualifiedApp = applications.find(app =>
          app.applicant.rating >= 4.0
        );

        if (qualifiedApp) {
          await api.acceptApplication(qualifiedApp.id);
          console.log('Accepted application from:', qualifiedApp.applicant.firstName);

          // Process payment
          const payment = await api.createPayment(job.id, job.budget);
          console.log('Payment initiated, redirect to:', payment.paymentUrl);
        }
      }
    }, 30000); // Check every 30 seconds

  } catch (error) {
    console.error('Error:', error.message);
  }
}

postAndManageJob();
```

### Python

#### Job Search and Application
```python
import asyncio
from tasklink_api import TaskLinkAPI

async def search_and_apply():
    api = TaskLinkAPI()

    try:
        # Login
        await api.login('worker@example.com', 'SecurePass123!')

        # Search for gardening jobs
        jobs = await api.search_jobs({
            'category': 'gardening',
            'location': 'Cape Town',
            'min_budget': 300,
            'max_budget': 1000,
            'limit': 10
        })

        print(f"Found {len(jobs)} gardening jobs")

        # Apply for suitable jobs
        for job in jobs:
            if job['budget'] <= 800:  # Within my rate range
                application = await api.apply_for_job(job['id'], {
                    'message': 'Experienced gardener with 5+ years...',
                    'proposed_rate': 650
                })
                print(f"Applied for: {job['title']}")

        # Monitor applications
        applications = await api.get_my_applications()
        pending_apps = [app for app in applications if app['status'] == 'PENDING']
        print(f"You have {len(pending_apps)} pending applications")

    except Exception as e:
        print(f"Error: {e}")

asyncio.run(search_and_apply())
```

#### Payment Processing
```python
import asyncio
from tasklink_api import TaskLinkAPI

async def process_payment():
    api = TaskLinkAPI()

    try:
        # Login as client
        await api.login('client@example.com', 'SecurePass123!')

        # Get accepted job
        job_id = 'job_123456'  # From previous interaction

        # Create payment
        payment = await api.create_payment(job_id, 750.00)

        print(f"Payment created: {payment['id']}")
        print(f"PayFast URL: {payment['paymentUrl']}")

        # In real app, redirect user to payment URL
        # After payment completion, webhook will notify

    except Exception as e:
        print(f"Error: {e}")

asyncio.run(process_payment())
```

## 🔧 SDKs and Libraries

### Official SDKs
- **JavaScript/Node.js**: `npm install @tasklink/sa-api`
- **Python**: `pip install tasklink-sa-api`
- **PHP**: `composer require tasklink/sa-api`
- **Go**: `go get github.com/tasklink/sa-api-go`

### Community Libraries
- **React**: `npm install react-tasklink-sa`
- **Vue.js**: `npm install vue-tasklink-sa`
- **Laravel**: `composer require tasklink/sa-laravel`
- **Django**: `pip install django-tasklink-sa`

## 🎯 Common Integration Patterns

### Webhook Handler
```javascript
const express = require('express');
const TaskLinkAPI = require('./tasklink-api');

const app = express();
app.use(express.json());

const api = new TaskLinkAPI();

// Webhook endpoint for payment notifications
app.post('/webhooks/payments', async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature (implement verifyWebhook function)
    if (!verifyWebhook(req, process.env.WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }

    switch (event.event) {
      case 'payment.completed':
        await handlePaymentCompleted(event.data.payment);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.data.payment);
        break;

      case 'job.completed':
        await handleJobCompleted(event.data.job);
        break;
    }

    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

async function handlePaymentCompleted(payment) {
  // Update local database
  await updateLocalPaymentStatus(payment.id, 'completed');

  // Notify relevant users
  await api.sendNotification(payment.workerId, {
    title: 'Payment Received',
    message: `Payment of R${payment.amount} has been processed`,
    type: 'PAYMENT_RECEIVED'
  });
}

async function handleJobCompleted(job) {
  // Update job status locally
  await updateLocalJobStatus(job.id, 'completed');

  // Trigger review process
  await api.requestReview(job.id, job.workerId);
}

app.listen(3000, () => {
  console.log('Webhook handler running on port 3000');
});
```

### Real-time Messaging
```javascript
const io = require('socket.io-client');
const TaskLinkAPI = require('./tasklink-api');

class TaskLinkMessenger {
  constructor() {
    this.api = new TaskLinkAPI();
    this.socket = null;
  }

  async connect(userToken) {
    // Authenticate with API first
    await this.api.setToken(userToken);

    // Connect to Socket.io
    this.socket = io('wss://api.tasklink.co.za', {
      auth: {
        token: userToken
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to TaskLink real-time');
    });

    this.socket.on('message', async (message) => {
      console.log('New message:', message.content);

      // Mark as read
      await this.api.markMessageRead(message.id);

      // Show notification
      this.showNotification(message);
    });

    this.socket.on('job_update', (update) => {
      console.log('Job updated:', update.jobId, update.status);
      this.handleJobUpdate(update);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time');
      // Implement reconnection logic
    });
  }

  async sendMessage(recipientId, jobId, content) {
    const message = await this.api.sendMessage({
      recipientId,
      jobId,
      content,
      messageType: 'TEXT'
    });

    return message;
  }

  showNotification(message) {
    // Implement platform-specific notification
    if ('Notification' in window) {
      new Notification('New Message', {
        body: message.content,
        icon: '/icon.png'
      });
    }
  }

  handleJobUpdate(update) {
    // Update UI with job status change
    updateJobInUI(update.jobId, update.status);
  }
}

// Usage
const messenger = new TaskLinkMessenger();
await messenger.connect(userToken);
```

### Error Handling and Retry Logic
```javascript
class TaskLinkAPIWithRetry {
  constructor(baseURL, maxRetries = 3) {
    this.baseURL = baseURL;
    this.maxRetries = maxRetries;
  }

  async request(endpoint, options = {}, retryCount = 0) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.calculateDelay(retryCount);
        await this.sleep(delay);

        return this.request(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  shouldRetry(error, retryCount) {
    if (retryCount >= this.maxRetries) return false;

    // Retry on network errors, 5xx errors, rate limits
    if (error.message.includes('fetch')) return true;
    if (error.message.includes('500')) return true;
    if (error.message.includes('429')) return true;

    return false;
  }

  calculateDelay(retryCount) {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.pow(2, retryCount) * 1000;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobs?${queryString}`);
  }
}

// Usage with automatic retry
const api = new TaskLinkAPIWithRetry('https://api.tasklink.co.za/v1');

try {
  const jobs = await api.getJobs({ category: 'cleaning' });
  console.log('Jobs retrieved:', jobs.length);
} catch (error) {
  console.error('Failed after retries:', error.message);
}
```

## 📱 Mobile App Integration

### React Native Example
```javascript
import TaskLinkAPI from 'react-native-tasklink-sa';
import { useEffect, useState } from 'react';

function JobListScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const api = new TaskLinkAPI();
      await api.login('user@example.com', 'password');

      const jobList = await api.getNearbyJobs({
        radius: 25,
        limit: 20
      });

      setJobs(jobList);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobId) => {
    try {
      const api = new TaskLinkAPI();
      await api.applyForJob(jobId, {
        message: 'I can complete this job...',
        proposedRate: 500
      });

      // Update UI to show application submitted
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to apply: ' + error.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobCard
          job={item}
          onApply={() => applyForJob(item.id)}
        />
      )}
    />
  );
}
```

## 🔧 Testing Examples

### Unit Testing API Calls
```javascript
const { TaskLinkAPI } = require('./tasklink-api');
const nock = require('nock');

describe('TaskLinkAPI', () => {
  let api;

  beforeEach(() => {
    api = new TaskLinkAPI('https://api.tasklink.co.za/v1');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('should login successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'mock_jwt_token',
        user: { id: 'user_123', email: 'test@example.com' }
      }
    };

    nock('https://api.tasklink.co.za/v1')
      .post('/auth/login')
      .reply(200, mockResponse);

    const result = await api.login('test@example.com', 'password');

    expect(result.token).toBe('mock_jwt_token');
    expect(result.user.email).toBe('test@example.com');
  });

  test('should handle API errors', async () => {
    nock('https://api.tasklink.co.za/v1')
      .post('/auth/login')
      .reply(401, {
        success: false,
        error: { message: 'Invalid credentials' }
      });

    await expect(api.login('wrong@email.com', 'wrongpass'))
      .rejects
      .toThrow('Invalid credentials');
  });
});
```

### Integration Testing
```javascript
const { TaskLinkAPI } = require('./tasklink-api');

describe('Job Management Flow', () => {
  let api;
  let testJobId;

  beforeAll(async () => {
    api = new TaskLinkAPI(process.env.TEST_API_URL);
    await api.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
  });

  test('should create job', async () => {
    const jobData = {
      title: 'Test Job',
      description: 'Test job description',
      category: 'cleaning',
      location: 'Test City',
      budget: 500,
      budgetType: 'fixed'
    };

    const job = await api.createJob(jobData);
    testJobId = job.id;

    expect(job.title).toBe('Test Job');
    expect(job.status).toBe('OPEN');
  });

  test('should retrieve job', async () => {
    const job = await api.getJob(testJobId);

    expect(job.id).toBe(testJobId);
    expect(job.title).toBe('Test Job');
  });

  test('should update job', async () => {
    const updateData = {
      budget: 600
    };

    const updatedJob = await api.updateJob(testJobId, updateData);

    expect(updatedJob.budget).toBe(600);
  });

  afterAll(async () => {
    // Clean up test data
    if (testJobId) {
      await api.deleteJob(testJobId);
    }
  });
});
```

## 🚀 Production Deployment

### Environment Configuration
```bash
# .env.production
TASKLINK_API_URL=https://api.tasklink.co.za/v1
TASKLINK_WEBHOOK_SECRET=your_webhook_secret
TASKLINK_CLIENT_ID=your_client_id
TASKLINK_CLIENT_SECRET=your_client_secret
```

### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Test API connectivity
    const api = new TaskLinkAPI();
    await api.getJobs({ limit: 1 });

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'responsive'
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Monitoring and Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log API requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    });
  });

  next();
});

// Log webhook events
app.post('/webhooks/*', (req, res, next) => {
  logger.info('Webhook Received', {
    event: req.body.event,
    id: req.body.id,
    timestamp: req.body.timestamp
  });

  next();
});
```

## 📞 Support

Need help with integration?

- **Documentation**: [docs.tasklink.co.za](https://docs.tasklink.co.za)
- **Developer Forum**: [community.tasklink.co.za](https://community.tasklink.co.za)
- **Email Support**: developers@tasklink.co.za
- **Live Chat**: Available during business hours

## 📝 Contributing

Found an error or want to add an example?

1. Fork the repository
2. Create a feature branch
3. Add your example with proper documentation
4. Submit a pull request

Please follow the existing code style and include comments explaining complex logic.