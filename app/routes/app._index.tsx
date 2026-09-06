import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getDashboardStats } from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const stats = await getDashboardStats(session.shop);
  return { shop: session.shop, ...stats };
};

function formatPoints(n: number) {
  return new Intl.NumberFormat("zh-CN").format(n);
}

export default function Dashboard() {
  const {
    settings,
    members,
    pointsIssued,
    pointsRedeemed,
    pointsOutstanding,
    recentActivity,
  } = useLoaderData<typeof loader>();
  const t = adminT(settings.adminLocale);
  const symbol = settings.currencySymbol || "€";
  const redeemPts = Math.round(
    settings.redeemPointsPerDollar * settings.defaultRedeemAmount,
  );

  return (
    <s-page heading={settings.programName || t.homeHeading}>
      <s-button slot="primary-action" href="/app/points">
        {t.homeEditProgram}
      </s-button>

      <s-section heading={t.homeOverview}>
        <s-paragraph>
          {t.homeOverviewDesc(
            String(settings.earnPointsPerDollar),
            symbol,
            String(redeemPts),
            settings.pointsCurrencyName,
            String(settings.defaultRedeemAmount),
          )}
        </s-paragraph>
        {!settings.programActive && (
          <s-banner tone="warning">{t.homePaused}</s-banner>
        )}
      </s-section>

      <s-section>
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))"
          gap="base"
        >
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-200">
              <s-text color="subdued">{t.homeMembers}</s-text>
              <s-heading>{formatPoints(members)}</s-heading>
            </s-stack>
          </s-box>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-200">
              <s-text color="subdued">{t.homeIssued}</s-text>
              <s-heading>{formatPoints(pointsIssued)}</s-heading>
            </s-stack>
          </s-box>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-200">
              <s-text color="subdued">{t.homeRedeemed}</s-text>
              <s-heading>{formatPoints(pointsRedeemed)}</s-heading>
            </s-stack>
          </s-box>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small-200">
              <s-text color="subdued">{t.homeOutstanding}</s-text>
              <s-heading>{formatPoints(pointsOutstanding)}</s-heading>
            </s-stack>
          </s-box>
        </s-grid>
      </s-section>

      <s-section heading={t.homeRecent}>
        {recentActivity.length === 0 ? (
          <s-paragraph>{t.homeNoActivity}</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>{t.homeColCustomer}</s-table-header>
              <s-table-header>{t.homeColType}</s-table-header>
              <s-table-header>{t.homeColPoints}</s-table-header>
              <s-table-header>{t.homeColDetail}</s-table-header>
              <s-table-header>{t.homeColWhen}</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {recentActivity.map((row) => (
                <s-table-row key={row.id}>
                  <s-table-cell>
                    {row.customer.displayName ||
                      row.customer.email ||
                      row.customer.shopifyCustomerId}
                  </s-table-cell>
                  <s-table-cell>{row.type}</s-table-cell>
                  <s-table-cell>
                    {row.points > 0 ? `+${row.points}` : row.points}
                  </s-table-cell>
                  <s-table-cell>{row.description}</s-table-cell>
                  <s-table-cell>
                    {new Date(row.createdAt).toLocaleString("zh-CN")}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-section slot="aside" heading={t.homeQuickLinks}>
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/customers">{t.homeManageCustomers}</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/points">{t.homeWays}</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/activity">{t.homeActivity}</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/settings">{t.homeSettings}</s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading={t.homeStorefront}>
        <s-paragraph>{t.homeStorefrontDesc}</s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
