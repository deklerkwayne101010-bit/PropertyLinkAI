# PowerShell script to set Vercel environment variables for TaskLink SA projects
# Run this after logging in with 'vercel login'

# Backend environment variables
cd tasklink-sa-backend

"postgresql://postgres.havufwwqyjkjckvrrpxh:SyUtcrFvn4BgG35f@aws-1-eu-west-2.pooler.supabase.com:6543/postgres" | vercel env add DATABASE_URL production
"https://havufwwqyjkjckvrrpxh.supabase.co" | vercel env add SUPABASE_URL production
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdnVmd3dxeWpramNrdnJycHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTM3MzMsImV4cCI6MjA3NTM4OTczM30.dqbtUNJ3Pbt-gKDzq5FfEbsnMpwdxGkINeo1LwU_Ykc" | vercel env add SUPABASE_ANON_KEY production

# Frontend environment variables
cd ../tasklink-sa-frontend

"https://havufwwqyjkjckvrrpxh.supabase.co" | vercel env add REACT_APP_SUPABASE_URL production
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdnVmd3dxeWpramNrdnJycHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTM3MzMsImV4cCI6MjA3NTM4OTczM30.dqbtUNJ3Pbt-gKDzq5FfEbsnMpwdxGkINeo1LwU_Ykc" | vercel env add REACT_APP_SUPABASE_ANON_KEY production

Write-Host "Environment variables configured. Note: Some variables (JWT_SECRET, etc.) need to be set manually with their actual values."