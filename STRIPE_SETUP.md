# Stripe Setup Guide

Follow these steps to configure Stripe for LoadoutX subscription payments.

## 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account verification (required for live payments)
3. Note: Start in **Test Mode** for development

## 2. Create Products & Prices

### In Stripe Dashboard:

**Product 1: X-Elite Monthly**
- Go to Products → Add Product
- Name: `X-Elite Monthly Subscription`
- Description: `Unlimited loadout generations, priority support`
- Pricing:
  - Type: `Recurring`
  - Price: `$5.00 USD`
  - Billing period: `Monthly`
- Click **Save product**
- Copy the **Price ID** (starts with `price_...`)

**Product 2: X-Ascended Lifetime**
- Go to Products → Add Product
- Name: `X-Ascended Lifetime Access`
- Description: `One-time payment for lifetime unlimited access`
- Pricing:
  - Type: `One-time`
  - Price: `$60.00 USD`
- Click **Save product**
- Copy the **Price ID** (starts with `price_...`)

## 3. Get Your API Keys

1. Go to Developers → API Keys
2. Copy your **Secret key** (starts with `sk_test_...` for test mode)
3. Keep these keys secure - never commit them to git!

## 4. Configure Environment Variables

### For Local Development:

Create a `.env` file in the project root:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_PRICE_ELITE_MONTHLY=price_your_elite_price_id
STRIPE_PRICE_ASCENDED_LIFETIME=price_your_ascended_price_id
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=your_postgres_connection_string
```

### For Vercel Production:

1. Go to your Vercel project → Settings → Environment Variables
2. Add these variables:
   - `STRIPE_SECRET_KEY` → `sk_live_...` (use live key for production)
   - `STRIPE_PRICE_ELITE_MONTHLY` → `price_...`
   - `STRIPE_PRICE_ASCENDED_LIFETIME` → `price_...`
   - `JWT_SECRET` → (your secure random string)

3. Redeploy the project for changes to take effect

## 5. Test the Integration

### Test Cards (in Test Mode):

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

### Testing Flow:

1. Sign up for an account on your site
2. Navigate to Pricing page
3. Click "Subscribe with Stripe" on X-Elite
4. Fill checkout form with test card
5. Complete payment
6. Verify you're redirected back with success
7. Check Account page - subscription should show "X-Elite"
8. Try generating more than 10 loadouts (should work unlimited)

## 6. Go Live

When ready for production:

1. In Stripe Dashboard, complete account activation
2. Switch from Test Mode to Live Mode
3. Create the same products in Live Mode
4. Update Vercel env vars with **live keys** (`sk_live_...`)
5. Redeploy

## 7. Monitor Payments

- Stripe Dashboard → Payments to see transactions
- Use Stripe webhooks for advanced payment tracking (optional)
- Check failed payments and retry logic

## Troubleshooting

**"Stripe is not configured" error:**
- Verify `STRIPE_SECRET_KEY` is set in environment variables
- Check the key starts with `sk_test_` or `sk_live_`
- Redeploy after adding env vars

**Payment succeeds but subscription not updated:**
- Check `/api/subscription/confirm` endpoint is working
- Verify user is signed in when completing checkout
- Check browser console and server logs for errors

**Webhook issues:**
- Not implemented yet; confirmations are done client-side via session_id
- For production, consider adding webhook endpoint for reliability

## Security Notes

- Never expose secret keys in client-side code
- Use test mode keys for development
- Rotate keys if compromised
- Enable Stripe Radar for fraud protection (live mode)
