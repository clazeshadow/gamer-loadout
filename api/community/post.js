import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

const PROFANITY = [
  'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','nigger','nigga','faggot','slut','whore'
]
const IMAGE_GEN_TERMS = [
  'image','picture','photo','generate','stable diffusion','sdxl','midjourney','dall-e','nsfw','nude','porn','sex','erotic'
]

function hasProfanity(text){
  const t = text.toLowerCase()
  return PROFANITY.some(w => t.includes(w))
}
function mentionsImageGen(text){
  const t = text.toLowerCase()
  return IMAGE_GEN_TERMS.some(w => t.includes(w))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in to post' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const { content } = req.body || {}
    const text = (content || '').toString().trim()
    if (!text) return res.status(400).json({ error: 'Message is required' })
    if (text.length > 1000) return res.status(400).json({ error: 'Message too long (1000 chars max)' })

    if (hasProfanity(text)) {
      return res.status(400).json({ error: 'Message blocked by profanity filter' })
    }
    if (mentionsImageGen(text)) {
      return res.status(400).json({ error: 'Image generation requests are not allowed' })
    }

    const msg = await prisma.communityMessage.create({
      data: { userId: user.id, content: text }
    })

    return res.status(201).json({ id: msg.id })
  } catch (err) {
    console.error('Community post error:', err)
    const status = err.name === 'JsonWebTokenError' ? 401 : 500
    return res.status(status).json({ error: 'Failed to post message' })
  } finally {
    await prisma.$disconnect()
  }
}
