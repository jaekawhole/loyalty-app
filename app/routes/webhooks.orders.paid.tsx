import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  calculateEarnPoints,
  earnFromOrder,
  getOrCreateSettings,
} from "../services/points.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  if (topic !== "ORDERS_PAID") {
    return new Response();
  }

  const settings = await getOrCreateSettings(shop);
  if (!settings.programActive) {
    return new Response();
  }

  const order = payload as {
    id: number | string;
    name?: string;
    customer?: {
      id?: number | string;
      email?: string;
      first_name?: string;
      last_name?: string;
    } | null;
    email?: string;
    subtotal_price?: string;
    current_subtotal_price?: string;
    total_price?: string;
    total_tax?: string;
    total_shipping_price_set?: { shop_money?: { amount?: string } };
  };

  const customerId = order.customer?.id;
  if (!customerId) {
    // Guest checkout — skip (Smile also requires membership for points)
    return new Response();
  }

  const points = calculateEarnPoints(order, settings);
  if (points <= 0) return new Response();

  const displayName = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ");

  await earnFromOrder({
    shop,
    shopifyCustomerId: String(customerId),
    email: order.customer?.email ?? order.email,
    displayName: displayName || null,
    orderId: String(order.id),
    orderName: order.name,
    points,
    description: `Earned from order ${order.name ?? order.id}`,
  });

  return new Response();
};
