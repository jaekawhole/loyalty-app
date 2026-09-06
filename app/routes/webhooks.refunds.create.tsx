import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getOrCreateSettings,
  refundPoints,
} from "../services/points.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  if (topic !== "REFUNDS_CREATE") {
    return new Response();
  }

  const settings = await getOrCreateSettings(shop);
  if (!settings.programActive) {
    return new Response();
  }

  const refund = payload as {
    id: number | string;
    order_id: number | string;
    transactions?: Array<{ amount?: string }>;
    refund_line_items?: Array<{
      subtotal?: string | number;
      total_tax?: string | number;
    }>;
    order_adjustments?: unknown[];
  };

  const orderId = String(refund.order_id);
  const earnEntry = await prisma.pointsLedger.findUnique({
    where: {
      shop_orderId_type: { shop, orderId, type: "EARN" },
    },
    include: { customer: true },
  });

  if (!earnEntry) {
    return new Response();
  }

  // Approximate refunded subtotal
  let refundedAmount = 0;
  if (refund.refund_line_items?.length) {
    for (const li of refund.refund_line_items) {
      refundedAmount += parseFloat(String(li.subtotal ?? 0));
      if (settings.includeTaxes) {
        refundedAmount += parseFloat(String(li.total_tax ?? 0));
      }
    }
  } else if (refund.transactions?.length) {
    refundedAmount = refund.transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount ?? "0"),
      0,
    );
  }

  const pointsToRevoke = Math.floor(
    refundedAmount * settings.earnPointsPerDollar,
  );
  if (pointsToRevoke <= 0) return new Response();

  await refundPoints({
    shop,
    shopifyCustomerId: earnEntry.customer.shopifyCustomerId,
    orderId,
    refundId: String(refund.id),
    points: pointsToRevoke,
    description: `Refund on order ${earnEntry.orderName ?? orderId}`,
  });

  return new Response();
};
