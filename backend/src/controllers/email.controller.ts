import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { QueueService } from '../services/queue.service';
import { prisma } from '../db/prisma';

export class EmailController {
  static async schedule(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        senderEmail,
        recipients,
        recipientEmail,
        subject,
        body,
        scheduledAt,
        delaySeconds,
        hourlyLimit,
      } = req.body;

      if (!senderEmail || !subject || !body) {
        return res.status(400).json({ error: 'Missing required email fields (senderEmail, subject, body)' });
      }

      const emailList: string[] = Array.isArray(recipients) && recipients.length > 0
        ? recipients
        : recipientEmail
          ? [recipientEmail]
          : [];

      if (emailList.length === 0) {
        return res.status(400).json({ error: 'At least one recipient email must be provided' });
      }

      const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date();

      if (emailList.length === 1) {
        const job = await QueueService.scheduleEmail({
          senderEmail,
          recipientEmail: emailList[0],
          subject,
          body,
          scheduledAt: scheduleDate,
          delaySeconds: delaySeconds ? parseInt(delaySeconds, 10) : 2,
          hourlyLimit: hourlyLimit ? parseInt(hourlyLimit, 10) : 200,
          userId: req.user?.userId,
        });
        return res.status(201).json({ success: true, count: 1, job });
      } else {
        const jobs = await QueueService.scheduleBatch({
          senderEmail,
          recipients: emailList,
          subject,
          body,
          startTime: scheduleDate,
          delayBetweenEmailsSeconds: delaySeconds ? parseInt(delaySeconds, 10) : 2,
          hourlyLimit: hourlyLimit ? parseInt(hourlyLimit, 10) : 200,
          userId: req.user?.userId,
        });
        return res.status(201).json({ success: true, count: jobs.length, jobs });
      }
    } catch (err: any) {
      console.error('Schedule Email Controller Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async uploadCsv(req: AuthenticatedRequest, res: Response) {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'No CSV or TXT file uploaded' });
      }

      const fileContent = file.buffer.toString('utf-8');
      const emails: Set<string> = new Set();
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      const matches = fileContent.match(emailRegex) || [];
      matches.forEach((m: string) => emails.add(m.trim().toLowerCase()));

      const extracted = Array.from(emails);
      return res.json({
        success: true,
        count: extracted.length,
        emails: extracted,
        preview: extracted.slice(0, 10),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getScheduled(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = '1', limit = '50', status } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
      const take = parseInt(limit as string, 10);

      const filterStatus = status
        ? (status as string)
        : { in: ['SCHEDULED', 'QUEUED', 'PROCESSING', 'RATE_LIMITED_DELAYED'] };

      const [items, total] = await Promise.all([
        prisma.emailJob.findMany({
          where: { status: filterStatus as any },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.emailJob.count({
          where: { status: filterStatus as any },
        })
      ]);

      return res.json({ items, total, page: parseInt(page as string, 10), limit: take });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getSent(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = '1', limit = '50', status } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
      const take = parseInt(limit as string, 10);

      const filterStatus = status ? (status as string) : { in: ['SENT', 'FAILED'] };

      const [items, total] = await Promise.all([
        prisma.emailJob.findMany({
          where: { status: filterStatus as any },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.emailJob.count({
          where: { status: filterStatus as any },
        })
      ]);

      return res.json({ items, total, page: parseInt(page as string, 10), limit: take });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const job = await QueueService.cancelEmail(id);
      return res.json({ success: true, job });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getSenders(req: AuthenticatedRequest, res: Response) {
    try {
      let senders = await prisma.senderAccount.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      });

      if (senders.length === 0) {
        const defaultSender1 = await prisma.senderAccount.create({
          data: {
            email: 'sales@reachinbox.ai',
            name: 'ReachInbox Sales Team',
          }
        });
        const defaultSender2 = await prisma.senderAccount.create({
          data: {
            email: 'growth@reachinbox.ai',
            name: 'ReachInbox Growth Team',
          }
        });
        senders = [defaultSender1, defaultSender2];
      }

      return res.json({ senders });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const [scheduledCount, sentCount, failedCount, rateLimitedCount] = await Promise.all([
        prisma.emailJob.count({ where: { status: { in: ['SCHEDULED', 'QUEUED', 'PROCESSING'] } } }),
        prisma.emailJob.count({ where: { status: 'SENT' } }),
        prisma.emailJob.count({ where: { status: 'FAILED' } }),
        prisma.emailJob.count({ where: { status: 'RATE_LIMITED_DELAYED' } }),
      ]);

      return res.json({
        scheduled: scheduledCount,
        sent: sentCount,
        failed: failedCount,
        rateLimited: rateLimitedCount,
        total: scheduledCount + sentCount + failedCount + rateLimitedCount,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
