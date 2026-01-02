import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const paidPlans = ['x-elite', 'x-ascended']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)
  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const { session_id: sessionId } = req.body || {}
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' })
  }

  const prisma = new PrismaClient()
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
    if (!session || !session.metadata?.plan) {
      return res.status(400).json({ error: 'Invalid checkout session' })
    }

    const plan = session.metadata.plan
    const isPaidPlan = paidPlans.includes(plan)
    const paymentOk = session.payment_status === 'paid' || session.status === 'complete'
    if (isPaidPlan && !paymentOk) {
      return res.status(402).json({ error: 'Payment not completed yet' })
    }

    // Ensure session email matches the logged-in user (basic guard)
    if (session.customer_details?.email && session.customer_details.email !== decoded.email) {
      return res.status(403).json({ error: 'Session does not belong to this user' })
    }

    const data = {
      subscription: plan,
      tier: plan === 'x-vanguard' ? 'free' : 'paid',
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripeSubscriptionId: typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || null
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data,
      select: {
        id: true,
        email: true,
        subscription: true,
        tier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true
      }
    })

    return res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Subscription confirm error:', error)
    return res.status(500).json({ error: 'Failed to confirm subscription' })
  } finally {
    await prisma.$disconnect()
  }
}
