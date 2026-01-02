import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal that the email doesn't exist for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, a password reset link has been sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // In production, send email here
    // For now, return the token (in production, remove this!)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'If an account exists, a password reset link has been sent',
      // TODO: Remove this in production - only for demo
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Password reset failed' });
  } finally {
    await prisma.$disconnect();
  }
}
