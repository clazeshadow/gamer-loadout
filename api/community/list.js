import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const take = Math.min(parseInt(req.query.take || '50', 10), 100)
    const messages = await prisma.communityMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { email: true } } }
    })
    const out = messages.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      user: { email: m.user.email.replace(/^(.).*(@.*)$/,'$1***$2') }
    }))
    return res.status(200).json({ messages: out })
  } catch (err) {
    console.error('Community list error:', err)
    return res.status(500).json({ error: 'Failed to load messages' })
  } finally {
    await prisma.$disconnect()
  }
}
