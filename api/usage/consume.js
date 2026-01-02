import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const FREE_DAILY_LIMIT = 10
const unlimitedPlans = ['x-elite', 'x-ascended']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, subscription: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const plan = user.subscription || 'x-vanguard'
    const isUnlimited = unlimitedPlans.includes(plan)

    // Round to UTC midnight for a stable per-day key
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Create or update usage row
    const usage = await prisma.generationUsage.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: isUnlimited ? {} : { count: { increment: 1 } },
      create: { userId: user.id, date: today, count: isUnlimited ? 0 : 1 }
    })

    const count = usage.count + (isUnlimited ? 0 : 1)
    if (!isUnlimited && count > FREE_DAILY_LIMIT) {
      // roll back increment if we overshot (race condition guard)
      await prisma.generationUsage.update({
        where: { userId_date: { userId: user.id, date: today } },
        data: { count: FREE_DAILY_LIMIT }
      })
      return res.status(429).json({
        error: 'Daily limit reached',
        limit: FREE_DAILY_LIMIT,
        remaining: 0,
        plan
      })
    }

    return res.status(200).json({
      success: true,
      plan,
      remaining: isUnlimited ? null : Math.max(FREE_DAILY_LIMIT - count, 0)
    })
  } catch (error) {
    console.error('Usage consume error:', error)
    const status = error.name === 'JsonWebTokenError' ? 401 : 500
    return res.status(status).json({ error: 'Failed to record usage' })
  } finally {
    await prisma.$disconnect()
  }
}
