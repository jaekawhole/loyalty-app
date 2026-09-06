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
  return { settings, shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      programName: String(form.get("programName") || "Fidélité"),
      pointsCurrencyName: String(form.get("pointsCurrencyName") || "points"),
      currencyCode: String(form.get("currencyCode") || "EUR"),
      currencySymbol: String(form.get("currencySymbol") || "€"),
      storefrontLocale: String(form.get("storefrontLocale") || "fr"),
      adminLocale: String(form.get("adminLocale") || "zh-CN"),
      programActive: form.get("programActive") === "on",
      includeShipping: form.get("includeShipping") === "on",
      includeTaxes: form.get("includeTaxes") === "on",
    },
  });

  return { ok: true };
};

export default function SettingsPage() {
  const { settings, shop } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const t = adminT(settings.adminLocale);

  return (
    <s-page heading={t.settingsHeading}>
      <s-section heading={t.settingsBranding}>
        <s-paragraph>{t.settingsBrandingDesc}</s-paragraph>
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="programName"
              label={t.settingsProgramName}
              value={settings.programName}
            />
            <s-text-field
              name="pointsCurrencyName"
              label={t.settingsPointsName}
              value={settings.pointsCurrencyName}
            />
            <s-text-field
              name="currencyCode"
              label={t.settingsCurrencyCode}
              value={settings.currencyCode}
            />
            <s-text-field
              name="currencySymbol"
              label={t.settingsCurrencySymbol}
              value={settings.currencySymbol}
            />
            <s-select
              name="storefrontLocale"
              label={t.settingsStorefrontLocale}
              value={settings.storefrontLocale}
            >
              <s-option value="fr">Français（法语）</s-option>
              <s-option value="en">English</s-option>
            </s-select>
            <s-select
              name="adminLocale"
              label={t.settingsAdminLocale}
              value={settings.adminLocale}
            >
              <s-option value="zh-CN">简体中文</s-option>
              <s-option value="en">English</s-option>
            </s-select>
            <s-checkbox
              name="programActive"
              label={t.settingsProgramActive}
              {...(settings.programActive ? { checked: true } : {})}
            />
            <s-checkbox
              name="includeShipping"
              label={t.settingsIncludeShipping}
              {...(settings.includeShipping ? { checked: true } : {})}
            />
            <s-checkbox
              name="includeTaxes"
              label={t.settingsIncludeTaxes}
              {...(settings.includeTaxes ? { checked: true } : {})}
            />
            <s-button
              type="submit"
              variant="primary"
              {...(busy ? { loading: true } : {})}
            >
              {t.settingsSave}
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      <s-section heading={t.settingsStorefront}>
        <s-ordered-list>
          <s-list-item>{t.settingsStep1}</s-list-item>
          <s-list-item>{t.settingsStep2}</s-list-item>
          <s-list-item>{t.settingsStep3}</s-list-item>
        </s-ordered-list>
        <s-paragraph>
          {t.settingsProxy}{" "}
          <code>https://{shop}/apps/loyalty</code>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
