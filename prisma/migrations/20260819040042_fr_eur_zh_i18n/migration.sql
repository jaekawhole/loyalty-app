-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "programName" TEXT NOT NULL DEFAULT 'Fidélité',
    "pointsCurrencyName" TEXT NOT NULL DEFAULT 'points',
    "earnPointsPerDollar" REAL NOT NULL DEFAULT 1,
    "redeemPointsPerDollar" REAL NOT NULL DEFAULT 20,
    "defaultRedeemAmount" REAL NOT NULL DEFAULT 5,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "currencySymbol" TEXT NOT NULL DEFAULT '€',
    "storefrontLocale" TEXT NOT NULL DEFAULT 'fr',
    "adminLocale" TEXT NOT NULL DEFAULT 'zh-CN',
    "programActive" BOOLEAN NOT NULL DEFAULT true,
    "includeShipping" BOOLEAN NOT NULL DEFAULT false,
    "includeTaxes" BOOLEAN NOT NULL DEFAULT false,
    "discountCodePrefix" TEXT NOT NULL DEFAULT 'FIDELITE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSettings" ("createdAt", "defaultRedeemAmount", "discountCodePrefix", "earnPointsPerDollar", "id", "includeShipping", "includeTaxes", "pointsCurrencyName", "programActive", "programName", "redeemPointsPerDollar", "shop", "updatedAt") SELECT "createdAt", "defaultRedeemAmount", "discountCodePrefix", "earnPointsPerDollar", "id", "includeShipping", "includeTaxes", "pointsCurrencyName", "programActive", "programName", "redeemPointsPerDollar", "shop", "updatedAt" FROM "ShopSettings";
DROP TABLE "ShopSettings";
ALTER TABLE "new_ShopSettings" RENAME TO "ShopSettings";
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
