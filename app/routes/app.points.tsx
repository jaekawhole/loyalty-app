import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { getOrCreateSettings } from "../services/points.server";
import { adminT } from "../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      earnPointsPerDollar: parseFloat(String(form.get("earnPointsPerDollar"))),
      redeemPointsPerDollar: parseFloat(
        String(form.get("redeemPointsPerDollar")),
      ),
      defaultRedeemAmount: parseFloat(String(form.get("defaultRedeemAmount"))),
      discountCodePrefix: String(form.get("discountCodePrefix") || "FIDELITE"),
    },
  });

  return { ok: true };
};

export default function PointsProgram() {
  const { settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const t = adminT(settings.adminLocale);
  const symbol = settings.currencySymbol || "€";
  const ptsForDefault = Math.round(
    settings.redeemPointsPerDollar * settings.defaultRedeemAmount,
  );

  return (
    <s-page heading={t.pointsHeading}>
      <s-section heading={t.pointsEarn}>
        <s-paragraph>{t.pointsEarnDesc}</s-paragraph>
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="small-200">
            <s-heading>{t.pointsPlaceOrder}</s-heading>
            <s-text>
              {t.pointsPlaceOrderDesc(
                symbol,
                String(settings.earnPointsPerDollar),
              )}
            </s-text>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading={t.pointsRedeem}>
        <s-paragraph>{t.pointsRedeemDesc}</s-paragraph>
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="small-200">
            <s-heading>
              {t.pointsOffDiscount(
                symbol,
                String(settings.defaultRedeemAmount),
              )}
            </s-heading>
            <s-text>
              {t.pointsCosts(
                String(ptsForDefault),
                settings.pointsCurrencyName,
                String(settings.redeemPointsPerDollar),
                symbol,
              )}
            </s-text>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading={t.pointsEdit}>
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="earnPointsPerDollar"
              label={t.pointsPerSpent(symbol)}
              value={String(settings.earnPointsPerDollar)}
            />
            <s-text-field
              name="redeemPointsPerDollar"
              label={t.pointsPerDiscount(symbol)}
              value={String(settings.redeemPointsPerDollar)}
              details={t.pointsPerDiscountHint(symbol)}
            />
            <s-text-field
              name="defaultRedeemAmount"
              label={t.pointsDefaultAmount(symbol)}
              value={String(settings.defaultRedeemAmount)}
            />
            <s-text-field
              name="discountCodePrefix"
              label={t.pointsPrefix}
              value={settings.discountCodePrefix}
            />
            <s-button
              type="submit"
              variant="primary"
              {...(busy ? { loading: true } : {})}
            >
              {t.pointsSave}
            </s-button>
          </s-stack>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
