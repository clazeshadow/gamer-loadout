import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  try {
    if (type === 'visit') {
      // Track site visit
      await prisma.siteVisit.create({
        data: {
          page: data?.page || null
        }
      });
      return res.status(200).json({ success: true });
    } 
    
    else if (type === 'game') {
      // Track game popularity
      const { gameName, platform } = data;
      
      const existing = await prisma.gamePopularity.findUnique({
        where: {
          gameName_platform: {
            gameName,
            platform: platform || ''
          }
        }
      });

      if (existing) {
        await prisma.gamePopularity.update({
          where: {
            gameName_platform: {
              gameName,
              platform: platform || ''
            }
          },
          data: {
            count: existing.count + 1,
            lastAccessed: new Date()
          }
        });
      } else {
        await prisma.gamePopularity.create({
          data: {
            gameName,
            platform: platform || '',
            count: 1
          }
        });
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid tracking type' });
  } catch (error) {
    console.error('Tracking error:', error);
    return res.status(500).json({ error: 'Failed to track analytics' });
  } finally {
    await prisma.$disconnect();
  }
}
