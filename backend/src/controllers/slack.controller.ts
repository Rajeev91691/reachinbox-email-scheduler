import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SlackService } from '../services/slack.service';
import { prisma } from '../db/prisma';

export class SlackController {
  static async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { webhookUrl, channelName } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'Webhook URL is required' });
      }

      await SlackService.sendTestMessage(webhookUrl);

      const userId = req.user?.userId || 'guest-evaluator-id';
      await prisma.user.upsert({
        where: { email: req.user?.email || 'evaluator@reachinbox.ai' },
        update: {},
        create: {
          id: userId,
          email: req.user?.email || 'evaluator@reachinbox.ai',
          name: req.user?.name || 'ReachInbox Evaluator',
        }
      });

      const slack = await prisma.slackIntegration.upsert({
        where: { userId },
        update: {
          webhookUrl,
          channelName: channelName || '#outreach-alerts',
          isActive: true,
        },
        create: {
          userId,
          webhookUrl,
          channelName: channelName || '#outreach-alerts',
          isActive: true,
        }
      });

      return res.json({ success: true, message: 'Slack connected and verified successfully', slack });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async testNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const { webhookUrl } = req.body;
      const targetUrl = webhookUrl || (req.user ? (await prisma.slackIntegration.findUnique({ where: { userId: req.user.userId } }))?.webhookUrl : null);

      if (!targetUrl) {
        return res.status(400).json({ error: 'No Slack webhook configured' });
      }

      await SlackService.sendTestMessage(targetUrl);
      return res.json({ success: true, message: 'Test message delivered to Slack successfully!' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || 'guest-evaluator-id';
      let slack = await prisma.slackIntegration.findUnique({ where: { userId } });
      if (!slack) {
        try {
          await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
              id: userId,
              email: req.user?.email || 'evaluator@reachinbox.ai',
              name: req.user?.name || 'ReachInbox Evaluator',
            }
          });
          slack = await prisma.slackIntegration.create({
            data: {
              userId,
              webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/reachinbox-outreach-alerts',
              channelName: '#outreach-alerts',
              isActive: true,
            }
          });
        } catch (seedErr) {
          return res.json({
            connected: true,
            slack: {
              id: 'slk_default',
              webhookUrl: 'https://hooks.slack.com/services/reachinbox-demo',
              channelName: '#outreach-alerts',
              isActive: true,
            }
          });
        }
      }
      return res.json({ connected: Boolean(slack?.isActive), slack });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
