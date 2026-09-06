/** Admin UI strings — 简体中文 / English */
export type AdminLocale = "zh-CN" | "en";

const zh = {
  navHome: "首页",
  navCustomers: "客户",
  navPoints: "积分规则",
  navActivity: "动态",
  navSettings: "设置",

  homeHeading: "忠诚计划",
  homeEditProgram: "编辑规则",
  homeOverview: "计划概览",
  homeOverviewDesc: (earn: string, currency: string, pts: string, pointsName: string, amount: string) =>
    `客户每消费 ${currency}1 可获得 ${earn} ${pointsName}；兑换 ${pts} ${pointsName} 可抵扣 ${currency}${amount}。`,
  homePaused: "计划已暂停。恢复前，订单不会发放积分。",
  homeMembers: "会员数",
  homeIssued: "已发放积分",
  homeRedeemed: "已兑换积分",
  homeOutstanding: "当前未兑积分",
  homeRecent: "最近动态",
  homeNoActivity: "暂无动态。客户付款下单或兑换后会出现在这里。",
  homeColCustomer: "客户",
  homeColType: "类型",
  homeColPoints: "积分",
  homeColDetail: "说明",
  homeColWhen: "时间",
  homeQuickLinks: "快捷入口",
  homeManageCustomers: "管理客户",
  homeWays: "赚取与兑换规则",
  homeActivity: "完整动态",
  homeSettings: "计划设置",
  homeStorefront: "前台",
  homeStorefrontDesc:
    "在主题 App embeds 中启用 Everyday Loyalty。浮窗仅对已登录且有过下单入账的客户显示（法语 / 欧元）。",

  customersHeading: "客户",
  customersMembers: "会员列表",
  customersSearchHint: "按邮箱、姓名或 Shopify 客户 ID 搜索",
  customersSearch: "搜索",
  customersSearchPh: "邮箱 / 姓名 / 客户 ID",
  customersEmpty: "暂无会员。登录客户付款下单后会自动出现。",
  customersBalance: "余额",
  customersLifetime: "累计获得",
  customersView: "详情",
  customersAdjust: "调整积分",
  customersReason: "原因",
  customersApply: "应用",
  customersAdjustPh: "+100 或 -50",

  customerBalance: "余额",
  customerAvailable: "可用积分",
  customerLifetimeEarned: "累计获得",
  customerLifetimeRedeemed: "累计兑换",
  customerAdjust: "手动调整",
  customerPointsDelta: "积分（+/-）",
  customerSave: "保存",
  customerRedeemFor: "代客兑换",
  customerRedeemDesc: (amount: string, cost: string, pointsName: string) =>
    `消耗 ${cost} ${pointsName}，生成 ${amount} 折扣码（仅该客户可用）。`,
  customerDiscountAmount: "折扣金额",
  customerCreateCode: "生成折扣码",
  customerIssued: "已发奖励",
  customerNoRedeem: "暂无兑换记录",
  customerCode: "折扣码",
  customerAmount: "金额",
  customerWhen: "时间",
  customerActivity: "动态",
  customerBalanceAfter: "变动后余额",
  customerDetail: "说明",
  customersBreadcrumb: "客户",

  pointsHeading: "积分规则",
  pointsEarn: "赚取方式",
  pointsEarnDesc: "当前：下单获得积分。",
  pointsPlaceOrder: "下单购买",
  pointsPlaceOrderDesc: (currency: string, earn: string) =>
    `已付款订单（需登录客户）按实付发放。默认：${currency}1 = ${earn} 积分。`,
  pointsRedeem: "兑换方式",
  pointsRedeemDesc: "固定金额折扣码，锁定客户、一次性使用。",
  pointsOffDiscount: (currency: string, amount: string) =>
    `${currency}${amount} 折扣`,
  pointsCosts: (pts: string, pointsName: string, per: string, currency: string) =>
    `需 ${pts} ${pointsName}（每 ${currency}1 折扣需 ${per} 积分）。`,
  pointsEdit: "编辑规则",
  pointsPerSpent: (currency: string) => `每消费 ${currency}1 获得积分`,
  pointsPerDiscount: (currency: string) => `每抵扣 ${currency}1 所需积分`,
  pointsPerDiscountHint: (currency: string) => `例：100 积分 ÷ 20 = ${currency}5`,
  pointsDefaultAmount: (currency: string) => `默认兑换金额（${currency}）`,
  pointsPrefix: "折扣码前缀",
  pointsSave: "保存规则",

  activityHeading: "动态",
  activitySection: "积分动态",
  activityDesc: "赚取、兑换、退款冲正与手动调整记录。",
  activityEmpty: "暂无动态。",

  settingsHeading: "设置",
  settingsBranding: "计划品牌与语言",
  settingsBrandingDesc:
    "前台面向法国客户（法语 / 欧元）；后台可选简体中文管理。",
  settingsProgramName: "计划名称（前台显示）",
  settingsPointsName: "积分名称（前台显示）",
  settingsCurrencyCode: "货币代码",
  settingsCurrencySymbol: "货币符号",
  settingsStorefrontLocale: "前台语言",
  settingsAdminLocale: "后台语言",
  settingsProgramActive: "计划启用 — 付款订单发放积分",
  settingsIncludeShipping: "计算积分时包含运费",
  settingsIncludeTaxes: "计算积分时包含税费",
  settingsSave: "保存设置",
  settingsStorefront: "前台安装",
  settingsStep1: "进入 Online Store → Themes",
  settingsStep2: "Customize → App embeds → 启用 Everyday Loyalty launcher",
  settingsStep3: "客户登录且有过下单入账后可见浮窗（法语）",
  settingsProxy: "App Proxy 路径：",
} as const;

type AdminDictBase = {
  [K in keyof typeof zh]: (typeof zh)[K] extends string
    ? string
    : (typeof zh)[K];
};

const en: AdminDictBase = {
  navHome: "Home",
  navCustomers: "Customers",
  navPoints: "Points",
  navActivity: "Activity",
  navSettings: "Settings",

  homeHeading: "Loyalty",
  homeEditProgram: "Edit program",
  homeOverview: "Program overview",
  homeOverviewDesc: (earn, currency, pts, pointsName, amount) =>
    `Customers earn ${earn} ${pointsName} per ${currency}1 spent, and redeem ${pts} ${pointsName} for ${currency}${amount} off.`,
  homePaused: "Program is paused. Orders will not award points until reactivated.",
  homeMembers: "Members",
  homeIssued: "Points issued",
  homeRedeemed: "Points redeemed",
  homeOutstanding: "Outstanding balance",
  homeRecent: "Recent activity",
  homeNoActivity: "No activity yet.",
  homeColCustomer: "Customer",
  homeColType: "Type",
  homeColPoints: "Points",
  homeColDetail: "Detail",
  homeColWhen: "When",
  homeQuickLinks: "Quick links",
  homeManageCustomers: "Manage customers",
  homeWays: "Ways to earn & redeem",
  homeActivity: "Full activity feed",
  homeSettings: "Program settings",
  homeStorefront: "Storefront",
  homeStorefrontDesc:
    "Enable Everyday Loyalty in theme App embeds. Launcher shows only for logged-in customers who have earned from an order (FR / EUR).",

  customersHeading: "Customers",
  customersMembers: "Loyalty members",
  customersSearchHint: "Search by email, name, or Shopify customer ID",
  customersSearch: "Search",
  customersSearchPh: "Email, name, or customer ID",
  customersEmpty: "No members yet.",
  customersBalance: "Balance",
  customersLifetime: "Lifetime earned",
  customersView: "View",
  customersAdjust: "Adjust points",
  customersReason: "Reason",
  customersApply: "Apply",
  customersAdjustPh: "+100 or -50",

  customerBalance: "Balance",
  customerAvailable: "Available",
  customerLifetimeEarned: "Lifetime earned",
  customerLifetimeRedeemed: "Lifetime redeemed",
  customerAdjust: "Adjust points",
  customerPointsDelta: "Points (+/−)",
  customerSave: "Save",
  customerRedeemFor: "Redeem on behalf of customer",
  customerRedeemDesc: (amount, cost, pointsName) =>
    `Issue a ${amount} discount for ${cost} ${pointsName}.`,
  customerDiscountAmount: "Discount amount",
  customerCreateCode: "Create discount code",
  customerIssued: "Issued rewards",
  customerNoRedeem: "No redemptions yet.",
  customerCode: "Code",
  customerAmount: "Amount",
  customerWhen: "When",
  customerActivity: "Activity",
  customerBalanceAfter: "Balance after",
  customerDetail: "Detail",
  customersBreadcrumb: "Customers",

  pointsHeading: "Points program",
  pointsEarn: "Ways to earn",
  pointsEarnDesc: "Currently: place an order.",
  pointsPlaceOrder: "Place an order",
  pointsPlaceOrderDesc: (currency, earn) =>
    `Paid orders (logged-in customers). Default: ${currency}1 = ${earn} point(s).`,
  pointsRedeem: "Ways to redeem",
  pointsRedeemDesc: "Fixed-amount discount codes, customer-locked, single use.",
  pointsOffDiscount: (currency, amount) => `${currency}${amount} off`,
  pointsCosts: (pts, pointsName, per, currency) =>
    `Costs ${pts} ${pointsName} (${per} points per ${currency}1).`,
  pointsEdit: "Edit rules",
  pointsPerSpent: (currency) => `Points per ${currency}1 spent`,
  pointsPerDiscount: (currency) => `Points required per ${currency}1 discount`,
  pointsPerDiscountHint: (currency) => `e.g. 100 ÷ 20 = ${currency}5 off`,
  pointsDefaultAmount: (currency) => `Default reward amount (${currency})`,
  pointsPrefix: "Discount code prefix",
  pointsSave: "Save rules",

  activityHeading: "Activity",
  activitySection: "Points activity",
  activityDesc: "Earn, redeem, refund, and manual adjustments.",
  activityEmpty: "No activity yet.",

  settingsHeading: "Settings",
  settingsBranding: "Branding & language",
  settingsBrandingDesc:
    "Storefront is French / Euro for customers; admin can use Simplified Chinese.",
  settingsProgramName: "Program name (storefront)",
  settingsPointsName: "Points name (storefront)",
  settingsCurrencyCode: "Currency code",
  settingsCurrencySymbol: "Currency symbol",
  settingsStorefrontLocale: "Storefront language",
  settingsAdminLocale: "Admin language",
  settingsProgramActive: "Program active — award points on paid orders",
  settingsIncludeShipping: "Include shipping in earn calculation",
  settingsIncludeTaxes: "Include taxes in earn calculation",
  settingsSave: "Save settings",
  settingsStorefront: "Storefront setup",
  settingsStep1: "Online Store → Themes",
  settingsStep2: "Customize → App embeds → enable Everyday Loyalty launcher",
  settingsStep3: "Visible after logged-in customer earns from an order (French)",
  settingsProxy: "App proxy path:",
};

export type AdminDict = AdminDictBase;

export function adminT(locale: string | null | undefined): AdminDict {
  return locale === "en" ? en : zh;
}

/** French (default) / English storefront panel copy — flat strings only (JSON-safe) */
export function storefrontI18nBundle(settings: {
  storefrontLocale: string;
  programName: string;
  pointsCurrencyName: string;
  currencySymbol: string;
  earnPointsPerDollar: number;
  redeemCost: number;
  defaultRedeemAmount: number;
}) {
  const symbol = settings.currencySymbol || "€";
  const pointsName = settings.pointsCurrencyName || "points";
  const earn = String(settings.earnPointsPerDollar);
  const cost = String(settings.redeemCost);
  const amount = String(settings.defaultRedeemAmount);
  const en = settings.storefrontLocale === "en";

  if (en) {
    return {
      balanceLabel: "Your balance",
      close: "Close",
      paused: "Program temporarily paused",
      earnTitle: "Ways to earn",
      placeOrder: "Place an order",
      earnDesc: `Earn ${earn} ${pointsName} for every ${symbol}1 spent.`,
      redeemTitle: "Redeem",
      offLabel: `${symbol}${amount} off`,
      redeemBtn: "Redeem reward",
      creating: "Creating code…",
      redeemed: "Redeemed",
      redeemFailed: "Redeem failed",
      networkError: "Network error — try again",
      yourCode: "Your code:",
      applyCheckout: "Apply it at checkout. New balance:",
      subtitle: `Earn ${earn} ${pointsName} per ${symbol}1 · Redeem ${cost} for ${symbol}${amount} off`,
      unlockError: "Rewards unlock after your first order",
    };
  }

  return {
    balanceLabel: "Votre solde",
    close: "Fermer",
    paused: "Programme temporairement suspendu",
    earnTitle: "Gagner des points",
    placeOrder: "Passer une commande",
    earnDesc: `Gagnez ${earn} ${pointsName} pour chaque ${symbol}1 dépensé.`,
    redeemTitle: "Utiliser vos points",
    offLabel: `${symbol}${amount} de réduction`,
    redeemBtn: "Échanger la récompense",
    creating: "Création du code…",
    redeemed: "Échangé",
    redeemFailed: "Échec de l'échange",
    networkError: "Erreur réseau — réessayez",
    yourCode: "Votre code :",
    applyCheckout: "À utiliser au paiement. Nouveau solde :",
    subtitle: `Gagnez ${earn} ${pointsName} par ${symbol}1 · Échangez ${cost} pour ${symbol}${amount}`,
    unlockError:
      "Les récompenses sont disponibles après votre première commande",
  };
}

/** @deprecated use storefrontI18nBundle */
export function storefrontI18n(locale: string | null | undefined) {
  return storefrontI18nBundle({
    storefrontLocale: locale || "fr",
    programName: "Fidélité",
    pointsCurrencyName: "points",
    currencySymbol: "€",
    earnPointsPerDollar: 1,
    redeemCost: 100,
    defaultRedeemAmount: 5,
  });
}
