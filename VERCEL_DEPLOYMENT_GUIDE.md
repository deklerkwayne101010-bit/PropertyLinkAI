# 🚀 Real Estate AI - Vercel Deployment Guide

## Prerequisites

1. **GitHub Account** - Create a repository for your project
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Account** - For database (already set up)
4. **Upstash Redis** - For caching (free tier available)
5. **SendGrid Account** - For email (free tier available)

---

## Step 1: Set Up Services

### 1.1 Create Upstash Redis Database
1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database
3. Copy the **REST API URL** and **REST Token** - you'll need these later

### 1.2 Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com) and sign up
2. Verify your email and create an API key
3. Copy the API key - you'll need it later

---

## Step 2: Prepare Your Code

### 2.1 Update Environment Variables

**Backend (.env file):**
```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase (from Supabase dashboard)
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Redis (from Upstash)
REDIS_URL="https://[YOUR-REDIS-URL].upstash.io"
REDIS_TOKEN="your-redis-token"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Email (SendGrid)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Environment
NODE_ENV="production"
```

**Frontend (.env file):**
```bash
REACT_APP_API_URL="https://your-backend-url.vercel.app"
REACT_APP_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
REACT_APP_SUPABASE_ANON_KEY="your-anon-key"
```

### 2.2 Update API Base URL in Frontend

Update `real-estate-ai-frontend/web/src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

---

## Step 3: Push to GitHub

### 3.1 Create GitHub Repository
1. Go to [github.com](https://github.com) and create a new repository
2. Name it `real-estate-ai` or whatever you prefer

### 3.2 Push Your Code
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Real Estate AI app"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

---

## Step 4: Deploy Backend to Vercel

### 4.1 Deploy Backend First
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `real-estate-ai-backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.2 Add Environment Variables
In Vercel dashboard, go to your project settings and add these environment variables:

```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
REDIS_URL=https://[YOUR-REDIS-URL].upstash.io
REDIS_TOKEN=your-redis-token
OPENAI_API_KEY=your-openai-api-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 4.3 Deploy Backend
1. Click "Deploy"
2. Wait for deployment to complete
3. Copy the backend URL (something like `https://real-estate-ai-backend.vercel.app`)

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Deploy Frontend
1. In Vercel dashboard, click "New Project"
2. Import the same GitHub repository again
3. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `real-estate-ai-frontend/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 5.2 Add Frontend Environment Variables
```
REACT_APP_API_URL=https://real-estate-ai-backend.vercel.app
REACT_APP_SUPABASE_URL=https://[PROJECT-REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 5.3 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be live at something like `https://real-estate-ai.vercel.app`

---

## Step 6: Test Your Deployment

### 6.1 Test Signup
1. Go to your live frontend URL
2. Try to sign up with a test account
3. Check if you receive the verification email

### 6.2 Test Database Connection
1. Check Vercel function logs to ensure database connection works
2. Verify users are being created in Supabase

### 6.3 Test Redis Connection
1. Check that caching features work (should not see Redis errors in logs)

---

## Troubleshooting

### Common Issues:

**1. Database Connection Issues:**
- Ensure you're using the pooled connection string from Supabase
- Check that the database URL is correct in Vercel env vars

**2. Redis Connection Issues:**
- Make sure you're using the REST API URL from Upstash
- Verify the REDIS_TOKEN is correct

**3. Email Not Sending:**
- Check SendGrid API key is correct
- Verify SMTP settings are properly configured

**4. CORS Issues:**
- Make sure the frontend REACT_APP_API_URL points to the correct backend URL
- Check that CORS is properly configured in the backend

---

## Final Checklist

- ✅ GitHub repository created and code pushed
- ✅ Backend deployed to Vercel with all environment variables
- ✅ Frontend deployed to Vercel with correct API URL
- ✅ Supabase database connected and tables created
- ✅ Upstash Redis configured
- ✅ SendGrid email service set up
- ✅ Signup functionality tested
- ✅ Email verification working

Your Real Estate AI app should now be live and fully functional! 🎉