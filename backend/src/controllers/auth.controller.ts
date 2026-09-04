import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { prisma } from '../db/prisma';

export class AuthController {
  static async googleLogin(req: Request, res: Response) {
    try {
      const { idToken, credential } = req.body;
      const tokenToVerify = idToken || credential;
      if (!tokenToVerify) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const { user, token } = await AuthService.verifyGoogleToken(tokenToVerify);
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        token,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await prisma.user.findUnique({
        where: { email: req.user.email },
        include: { slackConfig: true }
      });
      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
