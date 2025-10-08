# 🚀 Real Estate AI - Supabase Setup Guide

This guide will help you migrate from SQLite to Supabase PostgreSQL and deploy to Vercel.

## 📋 Prerequisites

- [Supabase Account](https://supabase.com) (free tier available)
- [Vercel Account](https://vercel.com) (free tier available)
- [Vercel CLI](https://vercel.com/cli) installed
- Node.js and npm installed

## 🗄️ Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: `real-estate-ai` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Wait for project creation (usually 2-3 minutes)

## 🔑 Step 2: Get Your Supabase Credentials

After project creation:

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Go to **Settings** → **Database**
4. Copy the **Connection string** (for pooled connections)

## 🛠️ Step 3: Run Setup Script

I've created a PowerShell script to automate the configuration:

```powershell
# Run the setup script (it will prompt for your credentials)
.\setup-supabase.ps1
```

**What the script does:**
- Creates `.env` files for backend and frontend
- Generates secure JWT secrets
- Sets up all required environment variables

## 📝 Step 4: Manual Configuration

After running the script, update these values in `real-estate-ai-backend/.env`:

### Required API Keys
```env
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-key-here"

# Get from https://autoenhance.ai/developers
AUTOENHANCE_API_KEY="your-autoenhance-key-here"
```

### Email Configuration (Choose one option)

**Option A: Gmail**
```env
EMAIL_FROM="your-email@gmail.com"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-email@gmail.com"
EMAIL_SMTP_PASS="your-gmail-app-password"
```

**Option B: SendGrid**
```env
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SMTP_HOST="smtp.sendgrid.net"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="apikey"
EMAIL_SMTP_PASS="your-sendgrid-api-key"
```

**Option C: Other SMTP**
```env
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SMTP_HOST="your-smtp-host"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-smtp-username"
EMAIL_SMTP_PASS="your-smtp-password"
```

## 🗃️ Step 5: Database Migration

```bash
# Navigate to backend directory
cd real-estate-ai-backend

# Generate Prisma client for PostgreSQL
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

## 🚀 Step 6: Deploy to Vercel

### Backend Deployment

```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy backend
cd real-estate-ai-backend
vercel --prod

# Copy the deployment URL (something like: https://real-estate-ai-backend.vercel.app)
```

### Frontend Deployment

```bash
# Update frontend .env with backend URL
# In real-estate-ai-frontend/web/.env
REACT_APP_API_URL="https://your-backend-url.vercel.app/api"

# Deploy frontend
cd real-estate-ai-frontend/web
vercel --prod
```

## 🔧 Step 7: Configure Vercel Environment Variables

In your Vercel dashboard, go to each project and add these environment variables:

### Backend Environment Variables
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=[generated-by-script]
JWT_REFRESH_SECRET=[generated-by-script]
OPENAI_API_KEY=sk-...
AUTOENHANCE_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
```

### Frontend Environment Variables
```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
REACT_APP_SUPABASE_URL=https://[ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ✅ Step 8: Test Your Deployment

1. Visit your frontend URL
2. Try creating a new account
3. Check that signup works and email verification is sent
4. Test login functionality

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
cd real-estate-ai-backend
npx prisma db push --preview-feature
```

### Vercel Build Issues
- Check that all environment variables are set in Vercel dashboard
- Ensure `vercel.json` is in the backend root directory
- Check build logs in Vercel dashboard

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Use a service like Mailgun or SendGrid for production

## 📊 Supabase Features You Can Use

- **Real-time subscriptions** for live property updates
- **File storage** for property images
- **Authentication** (can replace custom auth if desired)
- **Edge functions** for serverless compute
- **Database backups** and monitoring

## 💰 Cost Estimation

- **Supabase**: Free tier covers most small applications
- **Vercel**: Generous free tier, pay per usage
- **OpenAI**: ~$0.002 per 1K tokens
- **Autoenhance**: Pay per image processed

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords
- Regularly rotate API keys
- Enable MFA on all accounts
- Monitor usage and set up alerts

---

🎉 **Congratulations!** Your Real Estate AI application is now deployed and ready to use!

Need help? Check the Vercel and Supabase documentation, or create an issue in the repository.