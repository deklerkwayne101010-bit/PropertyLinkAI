-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "size" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "price" REAL,
    "features" JSONB,
    "propertyType" TEXT,
    "yearBuilt" INTEGER,
    "garage" INTEGER,
    "garden" BOOLEAN,
    "pool" BOOLEAN,
    "description" TEXT,
    "images" JSONB,
    "coordinates" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER,
    "tokensUsed" INTEGER,
    "cost" REAL,
    "cacheKey" TEXT,
    "isCached" BOOLEAN NOT NULL DEFAULT false,
    "cacheExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generated_content_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "operation" TEXT NOT NULL,
    "platform" TEXT,
    "tone" TEXT,
    "length" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "user_consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_processing_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_processing_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cache_metadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "photo_enhancements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "originalName" TEXT NOT NULL,
    "enhancedUrl" TEXT,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "enhancementOptions" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "photo_enhancements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "location" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "averagePrice" REAL,
    "medianPrice" REAL,
    "pricePerSqm" REAL,
    "totalListings" INTEGER,
    "soldListings" INTEGER,
    "averageDaysOnMarket" INTEGER,
    "priceTrend" TEXT,
    "trendPercentage" REAL,
    "dataPeriod" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextUpdate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "comparable_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketDataId" TEXT NOT NULL,
    "propertyId" TEXT,
    "address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "size" INTEGER,
    "landSize" INTEGER,
    "salePrice" REAL NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "daysOnMarket" INTEGER,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB,
    "coordinates" JSONB,
    "images" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comparable_sales_marketDataId_fkey" FOREIGN KEY ("marketDataId") REFERENCES "market_data" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comparable_sales_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "properties_location_idx" ON "properties"("location");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "properties"("propertyType");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE INDEX "properties_bedrooms_bathrooms_idx" ON "properties"("bedrooms", "bathrooms");

-- CreateIndex
CREATE INDEX "generated_content_propertyId_platform_tone_length_idx" ON "generated_content"("propertyId", "platform", "tone", "length");

-- CreateIndex
CREATE INDEX "generated_content_cacheKey_idx" ON "generated_content"("cacheKey");

-- CreateIndex
CREATE INDEX "generated_content_isCached_cacheExpiry_idx" ON "generated_content"("isCached", "cacheExpiry");

-- CreateIndex
CREATE INDEX "ai_usage_userId_date_idx" ON "ai_usage"("userId", "date");

-- CreateIndex
CREATE INDEX "ai_usage_platform_tone_length_idx" ON "ai_usage"("platform", "tone", "length");

-- CreateIndex
CREATE INDEX "ai_usage_date_idx" ON "ai_usage"("date");

-- CreateIndex
CREATE INDEX "content_templates_platform_tone_length_idx" ON "content_templates"("platform", "tone", "length");

-- CreateIndex
CREATE INDEX "content_templates_isActive_idx" ON "content_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "cache_metadata_cacheKey_key" ON "cache_metadata"("cacheKey");

-- CreateIndex
CREATE INDEX "cache_metadata_cacheKey_idx" ON "cache_metadata"("cacheKey");

-- CreateIndex
CREATE INDEX "cache_metadata_expiresAt_idx" ON "cache_metadata"("expiresAt");

-- CreateIndex
CREATE INDEX "cache_metadata_platform_tone_length_idx" ON "cache_metadata"("platform", "tone", "length");

-- CreateIndex
CREATE INDEX "cache_metadata_propertyId_idx" ON "cache_metadata"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_enhancements_orderId_key" ON "photo_enhancements"("orderId");

-- CreateIndex
CREATE INDEX "photo_enhancements_userId_createdAt_idx" ON "photo_enhancements"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "photo_enhancements_orderId_idx" ON "photo_enhancements"("orderId");

-- CreateIndex
CREATE INDEX "photo_enhancements_status_idx" ON "photo_enhancements"("status");

-- CreateIndex
CREATE INDEX "photo_enhancements_createdAt_idx" ON "photo_enhancements"("createdAt");

-- CreateIndex
CREATE INDEX "market_data_location_propertyType_idx" ON "market_data"("location", "propertyType");

-- CreateIndex
CREATE INDEX "market_data_dataSource_idx" ON "market_data"("dataSource");

-- CreateIndex
CREATE INDEX "market_data_lastUpdated_idx" ON "market_data"("lastUpdated");

-- CreateIndex
CREATE INDEX "market_data_isActive_idx" ON "market_data"("isActive");

-- CreateIndex
CREATE INDEX "market_data_location_propertyType_dataPeriod_idx" ON "market_data"("location", "propertyType", "dataPeriod");

-- CreateIndex
CREATE INDEX "comparable_sales_marketDataId_idx" ON "comparable_sales"("marketDataId");

-- CreateIndex
CREATE INDEX "comparable_sales_propertyId_idx" ON "comparable_sales"("propertyId");

-- CreateIndex
CREATE INDEX "comparable_sales_suburb_city_idx" ON "comparable_sales"("suburb", "city");

-- CreateIndex
CREATE INDEX "comparable_sales_saleDate_idx" ON "comparable_sales"("saleDate");

-- CreateIndex
CREATE INDEX "comparable_sales_salePrice_idx" ON "comparable_sales"("salePrice");

-- CreateIndex
CREATE INDEX "comparable_sales_propertyType_idx" ON "comparable_sales"("propertyType");
