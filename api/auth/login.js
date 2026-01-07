import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ASC_DOMAIN = '@loadoutx.org';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Elevate LoadoutX org accounts to ascended if needed
    let effectiveUser = user;
    if (user.email.toLowerCase().endsWith(ASC_DOMAIN) && user.subscription !== 'x-ascended') {
      effectiveUser = await prisma.user.update({
        where: { id: user.id },
        data: { subscription: 'x-ascended', tier: 'paid' }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: effectiveUser.id, email: effectiveUser.email, tier: effectiveUser.tier, subscription: effectiveUser.subscription },
      JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      user: {
        id: effectiveUser.id,
        email: effectiveUser.email,
        tier: effectiveUser.tier,
        subscription: effectiveUser.subscription,
        createdAt: effectiveUser.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  } finally {
    await prisma.$disconnect();
  }
}
