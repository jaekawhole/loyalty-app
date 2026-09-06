import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { getOrCreateSettings } from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [activity, settings] = await Promise.all([
    prisma.pointsLedger.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { customer: true },
    }),
    getOrCreateSettings(session.shop),
  ]);
  return { activity, settings };
};

export default function ActivityPage() {
  const { activity, settings } = useLoaderData<typeof loader>();
  const t = adminT(settings.adminLocale);

  return (
    <s-page heading={t.activityHeading}>
      <s-section heading={t.activitySection}>
        <s-paragraph>{t.activityDesc}</s-paragraph>
        {activity.length === 0 ? (
          <s-paragraph>{t.activityEmpty}</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>{t.homeColCustomer}</s-table-header>
              <s-table-header>{t.homeColType}</s-table-header>
              <s-table-header>{t.homeColPoints}</s-table-header>
              <s-table-header>{t.customerBalanceAfter}</s-table-header>
              <s-table-header>{t.homeColDetail}</s-table-header>
              <s-table-header>{t.homeColWhen}</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {activity.map((row) => (
                <s-table-row key={row.id}>
                  <s-table-cell>
                    <s-link href={`/app/customers/${row.customer.id}`}>
                      {row.customer.displayName ||
                        row.customer.email ||
                        row.customer.shopifyCustomerId}
                    </s-link>
                  </s-table-cell>
                  <s-table-cell>{row.type}</s-table-cell>
                  <s-table-cell>
                    {row.points > 0 ? `+${row.points}` : row.points}
                  </s-table-cell>
                  <s-table-cell>
                    {row.balanceAfter} {settings.pointsCurrencyName}
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
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
