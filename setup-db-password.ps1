# PowerShell script to set up the database password for Supabase
Write-Host "🔑 Real Estate AI - Database Password Setup" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

$password = Read-Host "Enter your Supabase database password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Update the .env file
$envFile = "real-estate-ai-backend\.env"
$content = Get-Content $envFile
$content = $content -replace "\[YOUR-PASSWORD\]", $passwordPlain
Set-Content -Path $envFile -Value $content

Write-Host "✅ Database password updated in .env file" -ForegroundColor Green
Write-Host "🚀 Running database migration..." -ForegroundColor Yellow

# Run the database migration
cd real-estate-ai-backend
npx prisma generate
npx prisma db push

Write-Host "✅ Database setup complete!" -ForegroundColor Green