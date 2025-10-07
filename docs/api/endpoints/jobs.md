# Jobs API

The Jobs API provides comprehensive functionality for creating, searching, managing, and interacting with job postings on TaskLink SA.

## Create Job

Create a new job posting as a client.

**Endpoint:** `POST /jobs`

**Authentication:** Required (Client role)

**Rate Limit:** 10 requests per minute

### Request Body
```json
{
  "title": "Garden Maintenance Service",
  "description": "Need someone to maintain my garden weekly. Tasks include mowing lawn, trimming hedges, and watering plants. Must have own equipment.",
  "category": "gardening",
  "subcategory": "maintenance",
  "location": "Cape Town, Western Cape",
  "coordinates": {
    "lat": -33.9249,
    "lng": 18.4241
  },
  "budget": 500.00,
  "budgetType": "fixed",
  "estimatedHours": 4,
  "requirements": ["gardening experience", "own equipment"],
  "preferredSkills": ["hedge trimming", "lawn mowing"],
  "equipmentNeeded": ["lawn mower", "hedge trimmers"],
  "ageRequirement": "18+",
  "genderPref": "any",
  "deadline": "2025-10-15T17:00:00.000Z",
  "images": ["https://example.com/image1.jpg"]
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Job title (5-100 characters) |
| description | string | Yes | Detailed job description (20-2000 characters) |
| category | string | Yes | Job category (e.g., "gardening", "cleaning") |
| subcategory | string | No | Job subcategory |
| location | string | Yes | Job location description |
| coordinates | object | No | GPS coordinates {lat, lng} |
| budget | number | Yes | Job budget in ZAR (R50-R50,000) |
| budgetType | string | Yes | "fixed" or "hourly" |
| estimatedHours | number | No | Estimated hours for hourly jobs |
| requirements | string[] | No | Required skills/certifications |
| preferredSkills | string[] | No | Preferred but not required skills |
| equipmentNeeded | string[] | No | Equipment needed for job |
| ageRequirement | string | No | Minimum age requirement |
| genderPref | string | No | Gender preference ("male", "female", "any") |
| deadline | string | No | Job deadline (ISO 8601 format) |
| images | string[] | No | Array of image URLs |

### Success Response (201)
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "description": "Need someone to maintain my garden weekly...",
      "category": "gardening",
      "location": "Cape Town, Western Cape",
      "coordinates": {
        "lat": -33.9249,
        "lng": 18.4241
      },
      "budget": 500.00,
      "budgetType": "fixed",
      "status": "OPEN",
      "priority": "MEDIUM",
      "posterId": "user_123",
      "createdAt": "2025-10-07T07:36:16.000Z",
      "poster": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.8,
        "reviewCount": 15,
        "profileImage": "https://example.com/profile.jpg"
      }
    }
  }
}
```

### Error Responses
- `400 VALIDATION_ERROR`: Invalid input data
- `401 UNAUTHENTICATED`: User not logged in
- `403 FORBIDDEN`: User is not a client

## Get Jobs

Retrieve a list of jobs with optional filtering and search.

**Endpoint:** `GET /jobs`

**Authentication:** Required

**Rate Limit:** 60 requests per minute

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by job category |
| subcategory | string | Filter by job subcategory |
| location | string | Search in location, title, description |
| minBudget | number | Minimum budget filter |
| maxBudget | number | Maximum budget filter |
| budgetType | string | "fixed" or "hourly" |
| status | string | Job status filter |
| priority | string | Job priority filter |
| skills | string[] | Required skills filter |
| radius | number | Search radius in km (1-200) |
| urgent | boolean | Show only urgent jobs |
| featured | boolean | Show only featured jobs |
| sortBy | string | Sort field: "createdAt", "budget", "deadline", "distance" |
| sortOrder | string | Sort order: "asc" or "desc" |
| page | number | Page number (default: 1) |
| limit | number | Items per page (1-100, default: 20) |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123456",
        "title": "Garden Maintenance Service",
        "description": "Need someone to maintain my garden...",
        "category": "gardening",
        "location": "Cape Town, Western Cape",
        "budget": 500.00,
        "budgetType": "fixed",
        "status": "OPEN",
        "priority": "MEDIUM",
        "createdAt": "2025-10-07T07:36:16.000Z",
        "distance": 2.5,
        "poster": {
          "id": "user_123",
          "firstName": "John",
          "lastName": "Doe",
          "rating": 4.8,
          "reviewCount": 15
        },
        "_count": {
          "applications": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## Get Job by ID

Retrieve detailed information about a specific job.

**Endpoint:** `GET /jobs/{id}`

**Authentication:** Required

**Rate Limit:** 60 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Job ID |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "description": "Need someone to maintain my garden weekly...",
      "category": "gardening",
      "location": "Cape Town, Western Cape",
      "coordinates": {
        "lat": -33.9249,
        "lng": 18.4241
      },
      "budget": 500.00,
      "budgetType": "fixed",
      "status": "OPEN",
      "priority": "MEDIUM",
      "requirements": ["gardening experience"],
      "preferredSkills": ["hedge trimming"],
      "equipmentNeeded": ["lawn mower"],
      "images": ["https://example.com/image1.jpg"],
      "createdAt": "2025-10-07T07:36:16.000Z",
      "distance": 2.5,
      "poster": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.8,
        "reviewCount": 15,
        "location": "Cape Town",
        "skills": ["project management"],
        "completedJobs": 45
      },
      "applications": [
        {
          "id": "app_789",
          "message": "I have 5 years experience in garden maintenance...",
          "proposedRate": 450.00,
          "status": "PENDING",
          "appliedAt": "2025-10-07T08:00:00.000Z",
          "applicant": {
            "id": "user_456",
            "firstName": "Jane",
            "lastName": "Smith",
            "rating": 4.9,
            "reviewCount": 28,
            "location": "Cape Town",
            "skills": ["gardening", "landscaping"]
          }
        }
      ],
      "_count": {
        "applications": 3
      }
    }
  }
}
```

### Error Responses
- `404 NOT_FOUND`: Job not found

## Update Job

Update an existing job posting.

**Endpoint:** `PUT /jobs/{id}`

**Authentication:** Required (Job owner only)

**Rate Limit:** 30 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Job ID |

### Request Body
Same as create job, but all fields are optional. Only provided fields will be updated.

### Success Response (200)
```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Updated Garden Maintenance Service",
      "budget": 550.00,
      // ... other updated fields
    }
  }
}
```

### Error Responses
- `403 FORBIDDEN`: User doesn't own the job
- `400 BAD_REQUEST`: Job cannot be updated (e.g., already assigned)

## Delete Job

Delete a job posting.

**Endpoint:** `DELETE /jobs/{id}`

**Authentication:** Required (Job owner only)

**Rate Limit:** 10 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Job ID |

### Success Response (200)
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### Error Responses
- `403 FORBIDDEN`: User doesn't own the job
- `400 BAD_REQUEST`: Job cannot be deleted (in progress/completed)

## Get Nearby Jobs

Find jobs near the user's current location.

**Endpoint:** `GET /jobs/nearby`

**Authentication:** Required

**Rate Limit:** 30 requests per minute

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| radius | number | 50 | Search radius in kilometers |
| limit | number | 20 | Maximum number of jobs to return |

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123456",
        "title": "Garden Maintenance Service",
        "location": "Cape Town, Western Cape",
        "budget": 500.00,
        "distance": 2.5,
        "createdAt": "2025-10-07T07:36:16.000Z",
        "poster": {
          "firstName": "John",
          "lastName": "Doe",
          "rating": 4.8
        }
      }
    ],
    "userLocation": {
      "lat": -33.9299,
      "lng": 18.4174
    },
    "searchRadius": 50
  }
}
```

### Error Responses
- `400 BAD_REQUEST`: User location not available

## Search Jobs

Advanced job search with full-text search capabilities.

**Endpoint:** `GET /jobs/search`

**Authentication:** Required

**Rate Limit:** 30 requests per minute

### Query Parameters
Same as GET /jobs, plus enhanced search capabilities.

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123456",
        "title": "Garden Maintenance Service",
        "description": "Need someone to maintain my garden...",
        "category": "gardening",
        "budget": 500.00,
        "createdAt": "2025-10-07T07:36:16.000Z",
        "poster": {
          "firstName": "John",
          "lastName": "Doe",
          "rating": 4.8
        },
        "_count": {
          "applications": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    },
    "searchCriteria": {
      "location": "Cape Town",
      "category": "gardening",
      "minBudget": 200,
      "maxBudget": 1000
    }
  }
}
```

## Make Job Featured

Upgrade a job to featured status for increased visibility.

**Endpoint:** `POST /jobs/{id}/featured`

**Authentication:** Required (Job owner only)

**Rate Limit:** 5 requests per minute

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Job ID |

### Success Response (200)
```json
{
  "success": true,
  "message": "Job is now featured",
  "data": {
    "job": {
      "id": "job_123456",
      "title": "Garden Maintenance Service",
      "featured": true
    }
  }
}
```

### Error Responses
- `403 FORBIDDEN`: User doesn't own the job
- `402 PAYMENT_REQUIRED`: Featured upgrade requires payment

## Job Categories

Common job categories on TaskLink SA:

- **Cleaning & Housekeeping**: Domestic cleaning, office cleaning, specialized cleaning
- **Gardening & Landscaping**: Lawn care, landscaping, tree work, irrigation
- **Handyman Services**: Repairs, maintenance, installations, carpentry
- **Painting & Decorating**: Interior painting, exterior painting, wallpaper
- **Plumbing & Electrical**: Plumbing repairs, electrical work, installations
- **Tutoring & Education**: Academic tutoring, music lessons, skill training
- **Delivery & Transport**: Local delivery, moving assistance, transportation
- **Event Services**: Setup, serving, event coordination, photography
- **Pet Care**: Dog walking, pet sitting, grooming services
- **Other**: Specialized services not covered above

## Job Statuses

- **DRAFT**: Job saved but not published
- **OPEN**: Job is live and accepting applications
- **ASSIGNED**: Worker has been selected and accepted
- **IN_PROGRESS**: Work has started
- **COMPLETED**: Job finished successfully
- **CANCELLED**: Job cancelled before completion
- **DISPUTED**: Job under dispute resolution

## Job Priorities

- **LOW**: Standard job, no rush
- **MEDIUM**: Normal priority job
- **HIGH**: Important job, preferred visibility
- **URGENT**: Time-sensitive, needs immediate attention

## Usage Examples

### Create a Simple Job
```javascript
const jobData = {
  title: "House Cleaning Service",
  description: "Need deep cleaning for 3-bedroom house",
  category: "cleaning",
  location: "Johannesburg, Gauteng",
  budget: 800.00,
  budgetType: "fixed"
};

const response = await fetch('/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(jobData)
});
```

### Search for Jobs
```javascript
const searchParams = new URLSearchParams({
  category: 'gardening',
  location: 'Cape Town',
  minBudget: 200,
  maxBudget: 1000,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

const response = await fetch(`/jobs?${searchParams}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Find Nearby Jobs
```javascript
const response = await fetch('/jobs/nearby?radius=25&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});