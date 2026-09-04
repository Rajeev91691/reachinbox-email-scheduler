import { initRedis } from './redis.service';
import { prisma } from '../db/prisma';
import { SlackService } from './slack.service';
import { config } from '../config/env';

export class RateLimiterService {
  static getHourWindowKey(date = new Date()): string {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }

  static async checkAndIncrement(senderEmail: string, customLimit?: number, userId?: string): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number;
    nextWindowDelayMs: number;
    hourWindow: string;
    rescheduledTo: Date;
  }> {
    const limit = customLimit || config.worker.maxEmailsPerHourPerSender;
    const hourWindow = this.getHourWindowKey();
    const redisKey = `ratelimit:${senderEmail}:${hourWindow}`;

    let currentCount = 0;
    try {
      const client = await initRedis();
      currentCount = await client.incr(redisKey);
      if (currentCount === 1) {
        await client.expire(redisKey, 7200);
      }
    } catch (e) {
      currentCount = 1;
    }

    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 5, 0);
    const nextWindowDelayMs = Math.max(1000, nextHour.getTime() - now.getTime());

    if (currentCount > limit) {
      try {
        const rateLog = await prisma.rateLimitLog.findUnique({
          where: {
            senderEmail_hourWindow: { senderEmail, hourWindow }
          }
        });

        if (!rateLog || !rateLog.limitHit) {
          await prisma.rateLimitLog.upsert({
            where: {
              senderEmail_hourWindow: { senderEmail, hourWindow }
            },
            update: {
              emailCount: currentCount,
              limitHit: true,
              notifiedAt: new Date()
            },
            create: {
              senderEmail,
              hourWindow,
              emailCount: currentCount,
              limitHit: true,
              notifiedAt: new Date()
            }
          });

          await SlackService.notifyRateLimitHit({
            senderEmail,
            hourlyLimit: limit,
            currentCount,
            hourWindow,
            rescheduledTo: nextHour,
            userId,
          });
        }
      } catch (dbErr) {
        console.warn('RateLimit DB log notice:', dbErr);
      }

      return {
        allowed: false,
        currentCount,
        limit,
        nextWindowDelayMs,
        hourWindow,
        rescheduledTo: nextHour,
      };
    }

    return {
      allowed: true,
      currentCount,
      limit,
      nextWindowDelayMs,
      hourWindow,
      rescheduledTo: nextHour,
    };
  }

  static async resetRateLimit(senderEmail: string) {
    const hourWindow = this.getHourWindowKey();
    const redisKey = `ratelimit:${senderEmail}:${hourWindow}`;
    const client = await initRedis();
    await client.del(redisKey);
  }
}
