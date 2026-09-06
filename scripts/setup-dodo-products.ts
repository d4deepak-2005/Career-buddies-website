import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import DodoPayments from 'dodopayments';

dotenv.config();

// One-time setup script: creates the three CareerBuddies programs as Dodo
// Payments products (Explore & Elevate at fixed prices, Excel as a
// "pay what you want" product for manually-priced enrollments), then prints
// (and appends to .env) the resulting product ids.
//
// Usage: npm run setup:dodo
// Safe to re-run: any plan whose *_PRODUCT_ID env var is already set is
// skipped so you don't end up with duplicate products in the dashboard.

const ENV_PATH = path.join(process.cwd(), '.env');

async function main() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.error('DODO_PAYMENTS_API_KEY is not set. Add it to .env first, then re-run this script.');
    process.exit(1);
  }

  const environment = process.env.DODO_PAYMENTS_ENV === 'live' ? 'live_mode' : 'test_mode';
  console.log(`Using Dodo Payments in ${environment}. Set DODO_PAYMENTS_ENV=live when you're ready to go live.\n`);

  const client = new DodoPayments({ bearerToken: apiKey, environment });

  const results: Record<string, string> = {};

  if (!process.env.DODO_EXPLORE_PRODUCT_ID) {
    const product = await client.products.create({
      name: 'Explore Plan',
      description: 'Career Discovery & Foundation — 2 focused 1:1 sessions, resume/LinkedIn audit, 90-day roadmap.',
      tax_category: 'edtech',
      price: {
        type: 'one_time_price',
        currency: 'INR',
        price: 499900,
        discount: 0,
        tax_inclusive: true
      }
    });
    console.log(`Created Explore Plan product: ${product.product_id}`);
    results.DODO_EXPLORE_PRODUCT_ID = product.product_id;
  } else {
    console.log(`Explore Plan already configured (${process.env.DODO_EXPLORE_PRODUCT_ID}), skipping.`);
  }

  if (!process.env.DODO_ELEVATE_PRODUCT_ID) {
    const product = await client.products.create({
      name: 'Elevate Plan',
      description: 'Transformation & Leveling — 6 dedicated 1:1 sessions, mock interviews, negotiation guidance.',
      tax_category: 'edtech',
      price: {
        type: 'one_time_price',
        currency: 'INR',
        price: 1499900,
        discount: 0,
        tax_inclusive: true
      }
    });
    console.log(`Created Elevate Plan product: ${product.product_id}`);
    results.DODO_ELEVATE_PRODUCT_ID = product.product_id;
  } else {
    console.log(`Elevate Plan already configured (${process.env.DODO_ELEVATE_PRODUCT_ID}), skipping.`);
  }

  if (!process.env.DODO_EXCEL_PRODUCT_ID) {
    const product = await client.products.create({
      name: 'Excel Program (Executive & Premium)',
      description: 'Elite executive coaching — final fee is set manually per candidate by the CareerBuddies team.',
      tax_category: 'edtech',
      price: {
        type: 'one_time_price',
        currency: 'INR',
        price: 100,
        discount: 0,
        tax_inclusive: true,
        pay_what_you_want: true
      }
    });
    console.log(`Created Excel Program product: ${product.product_id}`);
    results.DODO_EXCEL_PRODUCT_ID = product.product_id;
  } else {
    console.log(`Excel Program already configured (${process.env.DODO_EXCEL_PRODUCT_ID}), skipping.`);
  }

  if (Object.keys(results).length === 0) {
    console.log('\nAll three products were already configured. Nothing to do.');
    return;
  }

  const lines = Object.entries(results).map(([key, value]) => `${key}="${value}"`);
  console.log('\nAdd these to your .env (or your hosting provider\'s environment variables):\n');
  console.log(lines.join('\n'));

  if (fs.existsSync(ENV_PATH)) {
    fs.appendFileSync(ENV_PATH, `\n# Added by scripts/setup-dodo-products.ts\n${lines.join('\n')}\n`);
    console.log('\nAlso appended them to your local .env file.');
  }
}

main().catch((err) => {
  console.error('Failed to set up Dodo products:', err);
  process.exit(1);
});
