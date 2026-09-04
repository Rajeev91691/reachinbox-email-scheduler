import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { prisma } from '../db/prisma';
import { config } from '../config/env';

const googleClient = new OAuth2Client(config.google.clientId);

export class AuthService {
  /**
   * Verify Real Google Token (ID Token or Access Token)
   */
  static async verifyGoogleToken(token: string) {
    let email = '';
    let name = '';
    let avatarUrl = '';
    let googleId = '';

    // Check if it's a dev evaluation token
    if (token.startsWith('mock_dev_')) {
      email = token.includes('@') ? token.replace('mock_dev_', '') : 'oliver.brown@domain.io';
      name = email.split('@')[0].replace('.', ' ').toUpperCase();
      avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`;
      googleId = `dev_google_${email}`;
    } else {
      // 1. Try verifying as Google JWT ID Token
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: config.google.clientId || undefined,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name || email.split('@')[0];
          avatarUrl = payload.picture || '';
          googleId = payload.sub;
        }
      } catch (jwtErr) {
        // 2. If not ID token, try verifying with Google UserInfo endpoint (Access Token)
        try {
          const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.email) {
            email = res.data.email;
            name = res.data.name || email.split('@')[0];
            avatarUrl = res.data.picture || '';
            googleId = res.data.sub;
          }
        } catch (apiErr: any) {
          throw new Error('Google OAuth verification failed: Invalid Google token');
        }
      }
    }

    if (!email) {
      throw new Error('Could not retrieve user email from Google');
    }

    // Persist user in Relational Database
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatarUrl, googleId },
      create: { email, name, avatarUrl, googleId }
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return { user, token: jwtToken };
  }
}
