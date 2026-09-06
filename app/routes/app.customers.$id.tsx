import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  adjustPoints,
  calculateRedeemCost,
  getOrCreateSettings,
  redeemForDiscount,
} from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const customer = await prisma.customerPoints.findFirst({
    where: { id: params.id, shop: session.shop },
    include: {
      ledger: { orderBy: { createdAt: "desc" }, take: 50 },
      redemptions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!customer) throw new Response("Not found", { status: 404 });
  const settings = await getOrCreateSettings(session.shop);
  const redeemCost = calculateRedeemCost(
    settings.defaultRedeemAmount,
    settings,
  );
  return { customer, settings, redeemCost };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const customer = await prisma.customerPoints.findFirst({
    where: { id: params.id, shop: session.shop },
  });
  if (!customer) throw new Response("Not found", { status: 404 });

  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "adjust") {
    const delta = parseInt(String(form.get("delta")), 10);
    await adjustPoints({
      shop: session.shop,
      shopifyCustomerId: customer.shopifyCustomerId,
      delta,
      description: String(form.get("description") || "手动调整"),
    });
    return { ok: true };
  }

  if (intent === "redeem") {
    const settings = await getOrCreateSettings(session.shop);
    const amount = parseFloat(
      String(form.get("amount") || settings.defaultRedeemAmount),
    );
    const result = await redeemForDiscount({
      shop: session.shop,
      shopifyCustomerId: customer.shopifyCustomerId,
      discountAmountUsd: amount,
      settings,
      adminGraphql: (query, options) =>
        admin.graphql(query, options as { variables?: Record<string, never> }),
      email: customer.email,
      displayName: customer.displayName,
    });
    return { ok: true, code: result.code };
  }

  return { ok: false };
};

export default function CustomerDetail() {
  const { customer, settings, redeemCost } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const t = adminT(settings.adminLocale);
  const symbol = settings.currencySymbol || "€";

  return (
    <s-page heading={customer.displayName || customer.email || "客户"}>
      <s-link slot="breadcrumb-actions" href="/app/customers">
        {t.customersBreadcrumb}
      </s-link>
      <s-section heading={t.customerBalance}>
        <s-stack direction="inline" gap="large">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">{t.customerAvailable}</s-text>
              <s-heading>
                {customer.balance} {settings.pointsCurrencyName}
              </s-heading>
            </s-stack>
          </s-box>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">{t.customerLifetimeEarned}</s-text>
              <s-heading>{customer.lifetimeEarned}</s-heading>
            </s-stack>
          </s-box>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">{t.customerLifetimeRedeemed}</s-text>
              <s-heading>{customer.lifetimeRedeemed}</s-heading>
            </s-stack>
          </s-box>
        </s-stack>
        <s-paragraph>
          {customer.email} · Shopify ID {customer.shopifyCustomerId}
        </s-paragraph>
      </s-section>

      <s-section heading={t.customerAdjust}>
        <Form method="post">
          <input type="hidden" name="intent" value="adjust" />
          <s-stack direction="inline" gap="base" alignItems="end">
            <s-text-field name="delta" label={t.customerPointsDelta} />
            <s-text-field name="description" label={t.customersReason} />
            <s-button type="submit" {...(busy ? { loading: true } : {})}>
              {t.customerSave}
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section heading={t.customerRedeemFor}>
        <s-paragraph>
          {t.customerRedeemDesc(
            `${symbol}${settings.defaultRedeemAmount}`,
            String(redeemCost),
            settings.pointsCurrencyName,
          )}
        </s-paragraph>
        <Form method="post">
          <input type="hidden" name="intent" value="redeem" />
          <s-stack direction="inline" gap="base" alignItems="end">
            <s-text-field
              name="amount"
              label={t.customerDiscountAmount}
              value={String(settings.defaultRedeemAmount)}
            />
            <s-button
              type="submit"
              variant="primary"
              {...(busy ? { loading: true } : {})}
            >
              {t.customerCreateCode}
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section heading={t.customerIssued}>
        {customer.redemptions.length === 0 ? (
          <s-paragraph>{t.customerNoRedeem}</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>{t.customerCode}</s-table-header>
              <s-table-header>{t.customerAmount}</s-table-header>
              <s-table-header>{t.homeColPoints}</s-table-header>
              <s-table-header>{t.customerWhen}</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {customer.redemptions.map((r) => (
                <s-table-row key={r.id}>
                  <s-table-cell>
                    <strong>{r.discountCode}</strong>
                  </s-table-cell>
                  <s-table-cell>
                    {symbol}
                    {r.discountAmount}
                  </s-table-cell>
                  <s-table-cell>{r.pointsSpent}</s-table-cell>
                  <s-table-cell>
                    {new Date(r.createdAt).toLocaleString("zh-CN")}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-section heading={t.customerActivity}>
        <s-table>
          <s-table-header-row>
            <s-table-header>{t.homeColType}</s-table-header>
            <s-table-header>{t.homeColPoints}</s-table-header>
            <s-table-header>{t.customerBalanceAfter}</s-table-header>
            <s-table-header>{t.customerDetail}</s-table-header>
            <s-table-header>{t.customerWhen}</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {customer.ledger.map((row) => (
              <s-table-row key={row.id}>
                <s-table-cell>{row.type}</s-table-cell>
                <s-table-cell>
                  {row.points > 0 ? `+${row.points}` : row.points}
                </s-table-cell>
                <s-table-cell>{row.balanceAfter}</s-table-cell>
                <s-table-cell>{row.description}</s-table-cell>
                <s-table-cell>
                  {new Date(row.createdAt).toLocaleString("zh-CN")}
                </s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
