# PowerShell script to set up Supabase for Real Estate AI application
# Run this after creating your Supabase project

Write-Host "🚀 Real Estate AI - Supabase Setup Script" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Prompt for Supabase project details
$projectRef = Read-Host "Enter your Supabase project reference (from dashboard URL)"
$databasePassword = Read-Host "Enter your Supabase database password" -AsSecureString
$databasePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($databasePassword))

# Generate environment variables
$databaseUrl = "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
$databaseUrl = $databaseUrl.Replace("[PROJECT_REF]", $projectRef)
$databaseUrl = $databaseUrl.Replace("[PASSWORD]", $databasePasswordPlain)

$supabaseUrl = "https://[PROJECT_REF].supabase.co"
$supabaseUrl = $supabaseUrl.Replace("[PROJECT_REF]", $projectRef)

$supabaseAnonKey = Read-Host "Enter your Supabase anon/public key (from API settings)"
$supabaseServiceRoleKey = Read-Host "Enter your Supabase service_role key (from API settings)"

# Create .env file for backend
$backendEnv = @"
# Database
DATABASE_URL="$databaseUrl"

# Supabase
SUPABASE_URL="$supabaseUrl"
SUPABASE_ANON_KEY="$supabaseAnonKey"
SUPABASE_SERVICE_ROLE_KEY="$supabaseServiceRoleKey"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# Email (configure these with your email service)
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-email@gmail.com"
EMAIL_SMTP_PASS="your-app-password"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
AUTOENHANCE_API_KEY="your-autoenhance-api-key"

# Security
BCRYPT_SALT_ROUNDS="12"
"@

Set-Content -Path "real-estate-ai-backend\.env" -Value $backendEnv
Write-Host "✅ Backend .env file created" -ForegroundColor Green

# Create .env file for frontend
$frontendEnv = @"
REACT_APP_API_URL="https://your-vercel-backend-url.vercel.app/api"
REACT_APP_SUPABASE_URL="$supabaseUrl"
REACT_APP_SUPABASE_ANON_KEY="$supabaseAnonKey"
"@

Set-Content -Path "real-estate-ai-frontend\web\.env" -Value $frontendEnv
Write-Host "✅ Frontend .env file created" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update the email configuration in real-estate-ai-backend/.env" -ForegroundColor White
Write-Host "2. Add your API keys (OpenAI, Autoenhance) to the .env file" -ForegroundColor White
Write-Host "3. Run database migrations:" -ForegroundColor White
Write-Host "   cd real-estate-ai-backend" -ForegroundColor Yellow
Write-Host "   npx prisma generate" -ForegroundColor Yellow
Write-Host "   npx prisma db push" -ForegroundColor Yellow
Write-Host "4. Deploy to Vercel:" -ForegroundColor White
Write-Host "   - Backend: vercel --prod (from real-estate-ai-backend)" -ForegroundColor Yellow
Write-Host "   - Frontend: vercel --prod (from real-estate-ai-frontend/web)" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔐 Security Notes:" -ForegroundColor Yellow
Write-Host "- Never commit .env files to version control" -ForegroundColor Red
Write-Host "- Use strong, unique passwords for all services" -ForegroundColor Red
Write-Host "- Regularly rotate API keys and tokens" -ForegroundColor Red

Write-Host ""
Write-Host "🎉 Setup complete! Check the files and update any remaining configuration." -ForegroundColor Green