import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { adjustPoints, getOrCreateSettings } from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customerPoints.findMany({
    where: {
      shop: session.shop,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { displayName: { contains: q } },
              { shopifyCustomerId: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { balance: "desc" },
    take: 100,
  });

  const settings = await getOrCreateSettings(session.shop);
  return { customers, q, settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  if (intent === "adjust") {
    const customerId = String(form.get("customerId"));
    const delta = parseInt(String(form.get("delta")), 10);
    const description = String(form.get("description") || "手动调整");
    const customer = await prisma.customerPoints.findFirst({
      where: { id: customerId, shop: session.shop },
    });
    if (!customer) throw new Response("Not found", { status: 404 });
    await adjustPoints({
      shop: session.shop,
      shopifyCustomerId: customer.shopifyCustomerId,
      delta,
      description,
    });
  }

  return { ok: true };
};

export default function CustomersPage() {
  const { customers, q, settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const t = adminT(settings.adminLocale);

  return (
    <s-page heading={t.customersHeading}>
      <s-section heading={t.customersMembers}>
        <s-paragraph>{t.customersSearchHint}</s-paragraph>

        <Form method="get">
          <s-stack direction="inline" gap="base">
            <s-text-field
              name="q"
              label={t.customersSearch}
              labelAccessibilityVisibility="exclusive"
              value={q}
              placeholder={t.customersSearchPh}
            />
            <s-button type="submit">{t.customersSearch}</s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section>
        {customers.length === 0 ? (
          <s-paragraph>{t.customersEmpty}</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {customers.map((c) => (
              <s-box
                key={c.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-stack direction="block" gap="small-100">
                      <s-heading>
                        {c.displayName || c.email || "Customer"}
                      </s-heading>
                      <s-text color="subdued">
                        {c.email || `ID ${c.shopifyCustomerId}`} ·{" "}
                        {t.customersBalance}{" "}
                        <strong>
                          {c.balance} {settings.pointsCurrencyName}
                        </strong>{" "}
                        · {t.customersLifetime} {c.lifetimeEarned}
                      </s-text>
                    </s-stack>
                    <s-link href={`/app/customers/${c.id}`}>
                      {t.customersView}
                    </s-link>
                  </s-stack>

                  <Form method="post">
                    <input type="hidden" name="intent" value="adjust" />
                    <input type="hidden" name="customerId" value={c.id} />
                    <s-stack direction="inline" gap="base" alignItems="end">
                      <s-text-field
                        name="delta"
                        label={t.customersAdjust}
                        placeholder={t.customersAdjustPh}
                      />
                      <s-text-field
                        name="description"
                        label={t.customersReason}
                        placeholder="生日奖励"
                      />
                      <s-button type="submit" {...(busy ? { loading: true } : {})}>
                        {t.customersApply}
                      </s-button>
                    </s-stack>
                  </Form>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
