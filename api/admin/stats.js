import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@loadoutx.com'; // Set this in Vercel env vars

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    // Verify token and check if admin
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true }
    });

    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get site visit stats
    const totalVisits = await prisma.siteVisit.count();
    const visitsLast24h = await prisma.siteVisit.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    const visitsLast7d = await prisma.siteVisit.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get most popular games
    const popularGames = await prisma.gamePopularity.findMany({
      orderBy: { count: 'desc' },
      take: 10
    });

    // Get subscription stats
    const totalUsers = await prisma.user.count();
    const subscribedUsers = await prisma.user.findMany({
      where: {
        subscription: {
          in: ['x-elite', 'x-ascended']
        }
      },
      select: {
        id: true,
        email: true,
        subscription: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const subscriptionCounts = {
      'x-elite': subscribedUsers.filter(u => u.subscription === 'x-elite').length,
      'x-ascended': subscribedUsers.filter(u => u.subscription === 'x-ascended').length
    };

    return res.status(200).json({
      success: true,
      stats: {
        visits: {
          total: totalVisits,
          last24h: visitsLast24h,
          last7d: visitsLast7d
        },
        users: {
          total: totalUsers,
          subscribed: subscribedUsers.length,
          free: totalUsers - subscribedUsers.length
        },
        subscriptions: subscriptionCounts,
        popularGames: popularGames,
        subscribedUsers: subscribedUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  } finally {
    await prisma.$disconnect();
  }
}
