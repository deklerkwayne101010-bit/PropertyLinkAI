import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUserAccount = async (req: AuthRequest, res: Response) => {
  try {
    // Soft delete or anonymize user data for GDPR compliance
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: `deleted-${req.user!.id}@deleted.local`,
        name: 'Deleted User',
        subscriptionTier: 'free',
      },
    });

    res.json({ message: 'Account deletion request processed' });
  } catch (error) {
    console.error('Delete user account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};