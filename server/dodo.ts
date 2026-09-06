import DodoPayments from 'dodopayments';

// Dodo Payments (Merchant of Record) integration.
//
// Required env vars (see .env.example):
//   DODO_PAYMENTS_API_KEY        - secret bearer token from the Dodo dashboard
//   DODO_PAYMENTS_WEBHOOK_KEY    - webhook signing secret from the Dodo dashboard
//   DODO_PAYMENTS_ENV            - "live" or "test" (defaults to "test" for safety)
//   DODO_EXPLORE_PRODUCT_ID      - one-time product id for the Explore plan (₹4,999)
//   DODO_ELEVATE_PRODUCT_ID      - one-time product id for the Elevate plan (₹14,999)
//   DODO_EXCEL_PRODUCT_ID        - pay-what-you-want product id for Excel (manual amount)
//
// Run `npm run setup:dodo` once to auto-create the three products and print
// the product ids to paste into .env.

export type PlanId = 'explore' | 'elevate' | 'excel';

export const PLAN_DETAILS: Record<Exclude<PlanId, 'excel'>, { name: string; priceINR: number }> = {
  explore: { name: 'Explore Plan', priceINR: 4999 },
  elevate: { name: 'Elevate Plan', priceINR: 14999 }
};

function getDodoClient(): DodoPayments {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DODO_PAYMENTS_API_KEY is not configured. Add it to your .env / hosting secrets to enable payments.'
    );
  }
  return new DodoPayments({
    bearerToken: apiKey,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || null,
    environment: process.env.DODO_PAYMENTS_ENV === 'live' ? 'live_mode' : 'test_mode'
  });
}

function productIdForPlan(planId: PlanId): string {
  const envKey =
    planId === 'explore'
      ? 'DODO_EXPLORE_PRODUCT_ID'
      : planId === 'elevate'
        ? 'DODO_ELEVATE_PRODUCT_ID'
        : 'DODO_EXCEL_PRODUCT_ID';
  const productId = process.env[envKey];
  if (!productId) {
    throw new Error(`${envKey} is not configured. Run \`npm run setup:dodo\` or set it manually in .env.`);
  }
  return productId;
}

export interface CheckoutCustomer {
  email: string;
  name: string;
  phone?: string;
}

/**
 * Fixed-price checkout for the Explore / Elevate plans. The price is whatever
 * was configured on the Dodo product itself (see scripts/setup-dodo-products.ts).
 */
export async function createFixedPlanCheckout(params: {
  planId: 'explore' | 'elevate';
  customer: CheckoutCustomer;
  metadata: Record<string, string>;
  returnUrl: string;
  cancelUrl?: string;
}) {
  const client = getDodoClient();
  const productId = productIdForPlan(params.planId);

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email: params.customer.email, name: params.customer.name, phone_number: params.customer.phone || null },
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl || null,
    metadata: params.metadata
  });

  return session;
}

/**
 * Manual/custom-amount checkout for the Excel program. `amountINR` is entered
 * by an admin in the internal dashboard after negotiating the fee with the
 * candidate. Requires the Excel product to be configured as "pay what you
 * want" in Dodo (the setup script does this automatically).
 */
export async function createCustomAmountCheckout(params: {
  amountINR: number;
  customer: CheckoutCustomer;
  metadata: Record<string, string>;
  returnUrl: string;
  cancelUrl?: string;
}) {
  if (!Number.isFinite(params.amountINR) || params.amountINR <= 0) {
    throw new Error('amountINR must be a positive number.');
  }
  const client = getDodoClient();
  const productId = productIdForPlan('excel');
  const amountInPaise = Math.round(params.amountINR * 100);

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1, amount: amountInPaise }],
    customer: { email: params.customer.email, name: params.customer.name, phone_number: params.customer.phone || null },
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl || null,
    metadata: params.metadata
  });

  return session;
}

/**
 * Verifies and parses an incoming Dodo webhook. `rawBody` must be the exact,
 * unmodified request body string (do not JSON.parse/stringify it first, or
 * signature verification will fail).
 */
export function verifyDodoWebhook(rawBody: string, headers: Record<string, string>) {
  const client = getDodoClient();
  return client.webhooks.unwrap(rawBody, { headers });
}
