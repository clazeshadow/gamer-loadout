import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../_lib/mailer.js';

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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const isSpecialAsc = email.toLowerCase().endsWith(ASC_DOMAIN);

    // Create user with default free tier, or elevate special account to ascended
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        tier: isSpecialAsc ? 'paid' : 'free',
        subscription: isSpecialAsc ? 'x-ascended' : 'x-vanguard'
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, tier: user.tier, subscription: user.subscription },
      JWT_SECRET
    );

    // Fire and forget welcome email
    sendWelcomeEmail(user.email).catch(()=>{})

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        subscription: user.subscription,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  } finally {
    await prisma.$disconnect();
  }
}

