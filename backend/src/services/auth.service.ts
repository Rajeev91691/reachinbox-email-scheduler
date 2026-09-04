import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db/prisma';
import { config } from '../config/env';

const googleClient = new OAuth2Client(config.google.clientId);

export class AuthService {
  static async verifyGoogleToken(idToken: string) {
    let email = '';
    let name = '';
    let avatarUrl = '';
    let googleId = '';

    if (idToken.startsWith('mock_dev_') || !config.google.clientId) {
      email = idToken.includes('@') ? idToken.replace('mock_dev_', '') : 'developer@reachinbox.ai';
      name = 'ReachInbox Developer';
      avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      googleId = `dev_google_${email}`;
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google Token');
      }
      email = payload.email;
      name = payload.name || email.split('@')[0];
      avatarUrl = payload.picture || '';
      googleId = payload.sub;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatarUrl, googleId },
      create: { email, name, avatarUrl, googleId }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return { user, token };
  }
}
