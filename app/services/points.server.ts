import prisma from "../db.server";
import type { ShopSettings, CustomerPoints } from "@prisma/client";

export const DEFAULT_SETTINGS = {
  programName: "Fidélité",
  pointsCurrencyName: "points",
  earnPointsPerDollar: 1,
  redeemPointsPerDollar: 20, // 100 pts = €5
  defaultRedeemAmount: 5,
  currencyCode: "EUR",
  currencySymbol: "€",
  storefrontLocale: "fr",
  adminLocale: "zh-CN",
  programActive: true,
  includeShipping: false,
  includeTaxes: false,
  discountCodePrefix: "FIDELITE",
};

export async function getOrCreateSettings(shop: string): Promise<ShopSettings> {
  const row = await prisma.shopSettings.upsert({
    where: { shop },
    create: { shop, ...DEFAULT_SETTINGS },
    update: {},
  });

  // Migrate legacy English/$ defaults to FR/EUR for existing rows
  if (
    row.programName === "Rewards" ||
    row.currencyCode === "USD" ||
    row.discountCodePrefix === "REWARD"
  ) {
    return prisma.shopSettings.update({
      where: { shop },
      data: {
        programName:
          row.programName === "Rewards" ? "Fidélité" : row.programName,
        pointsCurrencyName:
          row.pointsCurrencyName === "Points"
            ? "points"
            : row.pointsCurrencyName,
        currencyCode: row.currencyCode === "USD" ? "EUR" : row.currencyCode,
        currencySymbol: row.currencySymbol === "$" ? "€" : row.currencySymbol,
        storefrontLocale:
          !row.storefrontLocale || row.storefrontLocale === "en"
            ? "fr"
            : row.storefrontLocale,
        adminLocale: row.adminLocale || "zh-CN",
        discountCodePrefix:
          row.discountCodePrefix === "REWARD"
            ? "FIDELITE"
            : row.discountCodePrefix,
      },
    });
  }

  return row;
}

export async function findCustomer(
  shop: string,
  shopifyCustomerId: string,
): Promise<CustomerPoints | null> {
  return prisma.customerPoints.findUnique({
    where: {
      shop_shopifyCustomerId: { shop, shopifyCustomerId },
    },
  });
}

/** True once the customer has earned points from at least one paid order */
export async function hasOrderedForLoyalty(
  shop: string,
  shopifyCustomerId: string,
): Promise<boolean> {
  const customer = await findCustomer(shop, shopifyCustomerId);
  if (!customer) return false;
  if (customer.lifetimeEarned > 0) return true;
  const earnCount = await prisma.pointsLedger.count({
    where: { shop, customerPointsId: customer.id, type: "EARN" },
  });
  return earnCount > 0;
}

export async function getOrCreateCustomer(
  shop: string,
  shopifyCustomerId: string,
  extras?: { email?: string | null; displayName?: string | null },
): Promise<CustomerPoints> {
  const existing = await findCustomer(shop, shopifyCustomerId);
  if (existing) {
    if (extras && (extras.email || extras.displayName)) {
      return prisma.customerPoints.update({
        where: { id: existing.id },
        data: {
          email: extras.email ?? existing.email,
          displayName: extras.displayName ?? existing.displayName,
        },
      });
    }
    return existing;
  }
  return prisma.customerPoints.create({
    data: {
      shop,
      shopifyCustomerId,
      email: extras?.email ?? null,
      displayName: extras?.displayName ?? null,
    },
  });
}

/** Calculate earnable points from an order payload */
export function calculateEarnPoints(
  order: {
    subtotal_price?: string | number | null;
    total_price?: string | number | null;
    total_shipping_price_set?: { shop_money?: { amount?: string } } | null;
    total_tax?: string | number | null;
    total_discounts?: string | number | null;
    current_subtotal_price?: string | number | null;
  },
  settings: ShopSettings,
): number {
  // Prefer current_subtotal (post-refund aware) then subtotal
  let base = parseFloat(
    String(order.current_subtotal_price ?? order.subtotal_price ?? 0),
  );
  if (settings.includeShipping) {
    const shipping = parseFloat(
      order.total_shipping_price_set?.shop_money?.amount ?? "0",
    );
    base += shipping;
  }
  if (settings.includeTaxes) {
    base += parseFloat(String(order.total_tax ?? 0));
  }
  if (base <= 0) return 0;
  return Math.floor(base * settings.earnPointsPerDollar);
}

export function calculateRedeemCost(
  discountAmountUsd: number,
  settings: ShopSettings,
): number {
  return Math.ceil(discountAmountUsd * settings.redeemPointsPerDollar);
}

/**
 * Award points for a paid order. Idempotent via (shop, orderId, type=EARN).
 */
export async function earnFromOrder(params: {
  shop: string;
  shopifyCustomerId: string;
  email?: string | null;
  displayName?: string | null;
  orderId: string;
  orderName?: string;
  points: number;
  description?: string;
}) {
  const { shop, shopifyCustomerId, orderId, points } = params;
  if (points <= 0) return null;

  const existing = await prisma.pointsLedger.findUnique({
    where: {
      shop_orderId_type: { shop, orderId, type: "EARN" },
    },
  });
  if (existing) return existing;

  const customer = await getOrCreateCustomer(shop, shopifyCustomerId, {
    email: params.email,
    displayName: params.displayName,
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.customerPoints.update({
      where: { id: customer.id },
      data: {
        balance: { increment: points },
        lifetimeEarned: { increment: points },
      },
    });
    return tx.pointsLedger.create({
      data: {
        shop,
        customerPointsId: customer.id,
        type: "EARN",
        points,
        balanceAfter: updated.balance,
        description: params.description ?? `Order ${params.orderName ?? orderId}`,
        orderId,
        orderName: params.orderName,
      },
    });
  });
}

/**
 * Reverse points on refund (full or proportional). Idempotent per refund id.
 */
export async function refundPoints(params: {
  shop: string;
  shopifyCustomerId: string;
  orderId: string;
  refundId: string;
  points: number;
  description?: string;
}) {
  const { shop, orderId, refundId, points } = params;
  if (points <= 0) return null;

  const idempotencyKey = `refund:${refundId}`;
  const existing = await prisma.pointsLedger.findUnique({
    where: {
      shop_orderId_type: { shop, orderId: idempotencyKey, type: "REFUND" },
    },
  });
  if (existing) return existing;

  const customer = await getOrCreateCustomer(shop, params.shopifyCustomerId);

  return prisma.$transaction(async (tx) => {
    const deduct = Math.min(points, customer.balance);
    const updated = await tx.customerPoints.update({
      where: { id: customer.id },
      data: {
        balance: { decrement: deduct },
      },
    });
    return tx.pointsLedger.create({
      data: {
        shop,
        customerPointsId: customer.id,
        type: "REFUND",
        points: -deduct,
        balanceAfter: updated.balance,
        description:
          params.description ?? `Refund for order ${orderId}`,
        orderId: idempotencyKey,
        orderName: orderId,
      },
    });
  });
}

/** Manual admin adjustment */
export async function adjustPoints(params: {
  shop: string;
  shopifyCustomerId: string;
  delta: number;
  description?: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const { shop, shopifyCustomerId, delta } = params;
  if (delta === 0) throw new Error("Adjustment cannot be zero");

  const customer = await getOrCreateCustomer(shop, shopifyCustomerId, {
    email: params.email,
    displayName: params.displayName,
  });

  if (customer.balance + delta < 0) {
    throw new Error("Insufficient points balance");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.customerPoints.update({
      where: { id: customer.id },
      data: {
        balance: { increment: delta },
        ...(delta > 0
          ? { lifetimeEarned: { increment: delta } }
          : {}),
      },
    });
    return tx.pointsLedger.create({
      data: {
        shop,
        customerPointsId: customer.id,
        type: "ADJUST",
        points: delta,
        balanceAfter: updated.balance,
        description: params.description ?? "Manual adjustment",
        orderId: `adjust:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      },
    });
  });
}

/**
 * Redeem points → create discount code via Admin API.
 * Returns { code, pointsSpent, discountAmount, redemption }
 */
export async function redeemForDiscount(params: {
  shop: string;
  shopifyCustomerId: string;
  discountAmountUsd: number;
  settings: ShopSettings;
  adminGraphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
  email?: string | null;
  displayName?: string | null;
}) {
  const { shop, shopifyCustomerId, discountAmountUsd, settings, adminGraphql } =
    params;

  if (!settings.programActive) {
    throw new Error("Loyalty program is paused");
  }
  if (discountAmountUsd <= 0) {
    throw new Error("Invalid discount amount");
  }

  const pointsNeeded = calculateRedeemCost(discountAmountUsd, settings);
  const customer = await getOrCreateCustomer(shop, shopifyCustomerId, {
    email: params.email,
    displayName: params.displayName,
  });

  if (customer.balance < pointsNeeded) {
    throw new Error(
      `Need ${pointsNeeded} points, have ${customer.balance}`,
    );
  }

  const code = `${settings.discountCodePrefix}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const startsAt = new Date().toISOString();
  const endsAt = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const customerGid = shopifyCustomerId.startsWith("gid://")
    ? shopifyCustomerId
    : `gid://shopify/Customer/${shopifyCustomerId}`;

  const response = await adminGraphql(
    `#graphql
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes { code }
              }
            }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        basicCodeDiscount: {
          title: `${settings.programName} — ${settings.currencySymbol}${discountAmountUsd} off`,
          code,
          startsAt,
          endsAt,
          usageLimit: 1,
          appliesOncePerCustomer: true,
          customerSelection: {
            customers: { add: [customerGid] },
          },
          customerGets: {
            value: {
              discountAmount: {
                amount: discountAmountUsd.toFixed(2),
                appliesOnEachItem: false,
              },
            },
            items: { all: true },
          },
        },
      },
    },
  );

  const json = await response.json();
  const payload = json.data?.discountCodeBasicCreate;
  const errors = payload?.userErrors ?? [];
  if (errors.length || !payload?.codeDiscountNode) {
    throw new Error(
      errors.map((e: { message: string }) => e.message).join("; ") ||
        "Failed to create discount code",
    );
  }

  const discountGid = payload.codeDiscountNode.id as string;
  const issuedCode =
    payload.codeDiscountNode.codeDiscount?.codes?.nodes?.[0]?.code ?? code;

  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.customerPoints.findUniqueOrThrow({
      where: { id: customer.id },
    });
    if (fresh.balance < pointsNeeded) {
      throw new Error("Insufficient points (race)");
    }
    const updated = await tx.customerPoints.update({
      where: { id: customer.id },
      data: {
        balance: { decrement: pointsNeeded },
        lifetimeRedeemed: { increment: pointsNeeded },
      },
    });
    await tx.pointsLedger.create({
      data: {
        shop,
        customerPointsId: customer.id,
        type: "REDEEM",
        points: -pointsNeeded,
        balanceAfter: updated.balance,
        description: `Redeemed ${settings.currencySymbol}${discountAmountUsd} off (${issuedCode})`,
        orderId: `redeem:${discountGid}`,
        metadata: JSON.stringify({ discountAmountUsd, code: issuedCode }),
      },
    });
    const redemption = await tx.redemption.create({
      data: {
        shop,
        customerPointsId: customer.id,
        pointsSpent: pointsNeeded,
        discountAmount: discountAmountUsd,
        discountCode: issuedCode,
        discountGid,
        status: "issued",
      },
    });
    return { updated, redemption, code: issuedCode, pointsNeeded };
  });

  return {
    code: result.code,
    pointsSpent: result.pointsNeeded,
    discountAmount: discountAmountUsd,
    balance: result.updated.balance,
    redemption: result.redemption,
  };
}

export async function getDashboardStats(shop: string) {
  const [members, earned, redeemed, recentActivity, settings] =
    await Promise.all([
      prisma.customerPoints.count({ where: { shop } }),
      prisma.pointsLedger.aggregate({
        where: { shop, type: "EARN" },
        _sum: { points: true },
      }),
      prisma.pointsLedger.aggregate({
        where: { shop, type: "REDEEM" },
        _sum: { points: true },
      }),
      prisma.pointsLedger.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: true },
      }),
      getOrCreateSettings(shop),
    ]);

  const totalBalance = await prisma.customerPoints.aggregate({
    where: { shop },
    _sum: { balance: true },
  });

  return {
    settings,
    members,
    pointsIssued: earned._sum.points ?? 0,
    pointsRedeemed: Math.abs(redeemed._sum.points ?? 0),
    pointsOutstanding: totalBalance._sum.balance ?? 0,
    recentActivity,
  };
}
