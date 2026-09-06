-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "programName" TEXT NOT NULL DEFAULT 'Rewards',
    "pointsCurrencyName" TEXT NOT NULL DEFAULT 'Points',
    "earnPointsPerDollar" REAL NOT NULL DEFAULT 1,
    "redeemPointsPerDollar" REAL NOT NULL DEFAULT 20,
    "defaultRedeemAmount" REAL NOT NULL DEFAULT 5,
    "programActive" BOOLEAN NOT NULL DEFAULT true,
    "includeShipping" BOOLEAN NOT NULL DEFAULT false,
    "includeTaxes" BOOLEAN NOT NULL DEFAULT false,
    "discountCodePrefix" TEXT NOT NULL DEFAULT 'REWARD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerPoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerPointsId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "orderId" TEXT,
    "orderName" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointsLedger_customerPointsId_fkey" FOREIGN KEY ("customerPointsId") REFERENCES "CustomerPoints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerPointsId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "discountAmount" REAL NOT NULL,
    "discountCode" TEXT NOT NULL,
    "discountGid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_customerPointsId_fkey" FOREIGN KEY ("customerPointsId") REFERENCES "CustomerPoints" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "CustomerPoints_shop_email_idx" ON "CustomerPoints"("shop", "email");

-- CreateIndex
CREATE INDEX "CustomerPoints_shop_balance_idx" ON "CustomerPoints"("shop", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPoints_shop_shopifyCustomerId_key" ON "CustomerPoints"("shop", "shopifyCustomerId");

-- CreateIndex
CREATE INDEX "PointsLedger_shop_createdAt_idx" ON "PointsLedger"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "PointsLedger_customerPointsId_createdAt_idx" ON "PointsLedger"("customerPointsId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PointsLedger_shop_orderId_type_key" ON "PointsLedger"("shop", "orderId", "type");

-- CreateIndex
CREATE INDEX "Redemption_shop_createdAt_idx" ON "Redemption"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "Redemption_discountCode_idx" ON "Redemption"("discountCode");
