import Stripe from 'stripe'
import jwt from 'jsonwebtoken'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const priceMap = {
  'x-elite': process.env.STRIPE_PRICE_ELITE_MONTHLY,
  'x-ascended': process.env.STRIPE_PRICE_ASCENDED_LIFETIME
}
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' })
  }

  const { plan, email } = req.body || {}
  if (!plan || !priceMap[plan]) {
    return res.status(400).json({ error: 'Invalid plan' })
  }

  const origin = req.headers.origin || 'http://localhost:3000'
  const authHeader = req.headers.authorization || ''
  let decoded = null
  if (authHeader.startsWith('Bearer ')) {
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET)
    } catch (e) {
      // ignore token errors for checkout creation; user will confirm later
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'x-elite' ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceMap[plan],
          quantity: 1
        }
      ],
      customer_email: email || decoded?.email,
      payment_method_types: ['card'],
      metadata: {
        plan,
        userId: decoded?.userId ? String(decoded.userId) : ''
      },
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}#subscribe`,
      cancel_url: `${origin}/#subscribe`
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
