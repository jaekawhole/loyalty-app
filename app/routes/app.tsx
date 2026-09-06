import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { getOrCreateSettings } from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    adminLocale: settings.adminLocale,
  };
};

export default function App() {
  const { apiKey, adminLocale } = useLoaderData<typeof loader>();
  const t = adminT(adminLocale);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">{t.navHome}</s-link>
        <s-link href="/app/customers">{t.navCustomers}</s-link>
        <s-link href="/app/points">{t.navPoints}</s-link>
        <s-link href="/app/activity">{t.navActivity}</s-link>
        <s-link href="/app/settings">{t.navSettings}</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
