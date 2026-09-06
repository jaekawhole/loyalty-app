import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  calculateRedeemCost,
  findCustomer,
  getOrCreateSettings,
  hasOrderedForLoyalty,
  redeemForDiscount,
} from "../services/points.server";
import { storefrontI18nBundle } from "../i18n";

/**
 * App proxy — storefront API (French / Euro for gomenin).
 * Widget is only visible after the customer has earned points from an order.
 */
async function handleProxy(request: Request) {
  const { session, admin, liquid } = await authenticate.public.appProxy(request);
  const shop = session?.shop;
  if (!shop) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const settings = await getOrCreateSettings(shop);
  const redeemCost = calculateRedeemCost(settings.defaultRedeemAmount, settings);
  const i18n = storefrontI18nBundle({
    storefrontLocale: settings.storefrontLocale,
    programName: settings.programName,
    pointsCurrencyName: settings.pointsCurrencyName,
    currencySymbol: settings.currencySymbol,
    earnPointsPerDollar: settings.earnPointsPerDollar,
    redeemCost,
    defaultRedeemAmount: settings.defaultRedeemAmount,
  });

  if (url.searchParams.get("view") === "panel") {
    return liquid(`
      {% if customer %}
        <div id="everyday-loyalty-boot"
          data-customer-id="{{ customer.id }}"
          data-customer-email="{{ customer.email }}"
          data-customer-name="{{ customer.first_name }} {{ customer.last_name }}">
        </div>
      {% else %}
        <div id="everyday-loyalty-boot" data-customer-id=""></div>
      {% endif %}
    `);
  }

  const base = {
    programName: settings.programName,
    pointsCurrencyName: settings.pointsCurrencyName,
    programActive: settings.programActive,
    earnPointsPerDollar: settings.earnPointsPerDollar,
    redeemPointsPerDollar: settings.redeemPointsPerDollar,
    defaultRedeemAmount: settings.defaultRedeemAmount,
    redeemCost,
    currencyCode: settings.currencyCode,
    currencySymbol: settings.currencySymbol,
    storefrontLocale: settings.storefrontLocale,
    i18n,
  };

  if (!customerId) {
    return Response.json({
      ...base,
      loggedIn: false,
      visible: false,
    });
  }

  const eligible = await hasOrderedForLoyalty(shop, String(customerId));

  if (request.method === "POST") {
    if (!eligible) {
      return Response.json({ error: i18n.unlockError }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const intent = body.intent ?? "redeem";

    if (intent === "redeem") {
      if (!admin) {
        return Response.json(
          { error: "Admin session unavailable" },
          { status: 503 },
        );
      }
      const amount = Number(body.amount ?? settings.defaultRedeemAmount);
      try {
        const result = await redeemForDiscount({
          shop,
          shopifyCustomerId: String(customerId),
          discountAmountUsd: amount,
          settings,
          adminGraphql: (query, options) =>
            admin.graphql(query, options as { variables?: Record<string, never> }),
        });
        return Response.json({
          ok: true,
          code: result.code,
          pointsSpent: result.pointsSpent,
          discountAmount: result.discountAmount,
          balance: result.balance,
        });
      } catch (e) {
        return Response.json(
          { error: e instanceof Error ? e.message : i18n.redeemFailed },
          { status: 400 },
        );
      }
    }
  }

  if (!eligible) {
    return Response.json({
      ...base,
      loggedIn: true,
      visible: false,
    });
  }

  const customer = await findCustomer(shop, String(customerId));
  return Response.json({
    ...base,
    loggedIn: true,
    visible: true,
    balance: customer?.balance ?? 0,
    lifetimeEarned: customer?.lifetimeEarned ?? 0,
    customerId: String(customerId),
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) =>
  handleProxy(request);

export const action = async ({ request }: ActionFunctionArgs) =>
  handleProxy(request);
