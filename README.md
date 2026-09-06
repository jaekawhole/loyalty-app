# Everyday Loyalty

Shopify loyalty / CRM points app inspired by Smile ? for **gomenin** first, multi-tenant ready for App Store later.

## Rules (defaults)

| Action | Rate |
|--------|------|
| Earn on paid order | **$1 = 1 point** (subtotal, excl. shipping/tax) |
| Redeem | **100 points = $5** discount code (20 pts / $1) |

Discount codes are single-use and locked to the customer.

## Smile-inspired structure

**Admin (embedded app)**
- **Home** ??program overview metrics + recent activity
- **Customers** ??member CRM, adjust points, redeem on behalf
- **Points** ??earn / redeem rules
- **Activity** ??full ledger feed
- **Settings** ??program name, pause, tax/shipping toggles

**Storefront**
- Theme app embed: floating **launcher + panel** (Smile-style)
- App proxy API at `/apps/loyalty`

## Stack

- Shopify React Router app template
- Prisma + SQLite (swap to Postgres for production)
- Theme app extension
- Webhooks: `orders/paid`, `refunds/create`

## Setup (gomenin)

```bash
cd loyalty-app
npm install
npx prisma migrate dev --name loyalty
npm run dev
```

When CLI asks which store, pick **gomenin1029.myshopify.com**.

Then:
1. Install the app on the store
2. Online Store ??Themes ??Customize ??**App embeds** ??enable **Everyday Loyalty launcher**
3. Place a test order with a logged-in customer ??points appear in admin + panel

## Scopes

`read_orders`, `write_discounts`, `read_discounts`, `read_customers`, `write_customers`

## Later: App Store

Already using `AppDistribution.AppStore`, shop-scoped data, and OAuth. Before listing, add:
- Billing API
- Privacy / GDPR compliance webhooks
- Privacy policy URL
- Postgres + hosting
