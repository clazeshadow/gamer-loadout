import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const XAI_API_KEY = process.env.XAI_API_KEY
const paidPlans = ['x-elite', 'x-ascended']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!XAI_API_KEY) {
    console.error('XAI_API_KEY env var is missing')
    return res.status(500).json({ error: 'Chat is not configured' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in with a paid plan to use chat' })
  }

  const token = authHeader.substring(7)
  let user

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, subscription: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
  } catch (err) {
    console.error('Chat auth error:', err)
    const status = err.name === 'JsonWebTokenError' ? 401 : 500
    return res.status(status).json({ error: 'Authentication failed' })
  }

  const plan = user.subscription || 'x-vanguard'
  if (!paidPlans.includes(plan)) {
    return res.status(403).json({ error: 'Upgrade to a paid plan to use the AI chat' })
  }

  const { prompt } = req.body || {}
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  const normalizedPrompt = prompt.trim().toLowerCase()
  const promptHash = crypto.createHash('sha256').update(normalizedPrompt).digest('hex')

  try {
    // Check cache first
    const cached = await prisma.chatCache.findUnique({ where: { promptHash } })
    if (cached) {
      return res.status(200).json({ reply: cached.response, cached: true })
    }

    const systemPrompt = 'You are LoadoutX Tactical Guide. Given a short user request, reply with 3-5 concise game suggestions and one-line reasons tailored to their ask. Keep responses under 120 words, no bullet markers unless meaningful, and avoid repeating the request.'

    const apiRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'grok-4-latest',
        stream: false,
        temperature: 0.4
      })
    })

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => 'Unknown error')
      console.error('Grok API error:', apiRes.status, errText)
      return res.status(502).json({ error: 'Upstream AI call failed' })
    }

    const data = await apiRes.json()
    const reply = data?.choices?.[0]?.message?.content || 'No answer returned.'

    // Cache the response
    await prisma.chatCache.create({
      data: {
        promptHash,
        prompt: prompt.trim().slice(0, 500),
        response: reply
      }
    })

    return res.status(200).json({ reply, cached: false })
  } catch (error) {
    console.error('Chat suggest error:', error)
    return res.status(500).json({ error: 'Failed to generate suggestions' })
  } finally {
    await prisma.$disconnect()
  }
}
