import axios from 'axios';
import { prisma } from '../db/prisma';
import { config } from '../config/env';

export class SlackService {
  static async notifyRateLimitHit(params: {
    senderEmail: string;
    hourlyLimit: number;
    currentCount: number;
    hourWindow: string;
    rescheduledTo: Date;
    userId?: string;
  }): Promise<boolean> {
    try {
      let webhookUrl = config.slack.defaultWebhookUrl;

      if (params.userId) {
        const slackConfig = await prisma.slackIntegration.findUnique({
          where: { userId: params.userId },
        });
        if (slackConfig && slackConfig.webhookUrl && slackConfig.isActive) {
          webhookUrl = slackConfig.webhookUrl;
        }
      }

      if (!webhookUrl) {
        console.log(`ℹ️ Slack notification skipped (no webhook configured for sender: ${params.senderEmail})`);
        return false;
      }

      const payload = {
        text: `⚠️ *ReachInbox Rate Limit Alert*: Sender \`${params.senderEmail}\` reached hourly cap!`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🚨 ReachInbox Hourly Rate Limit Triggered",
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Sender Account:*\n\`${params.senderEmail}\``
              },
              {
                type: "mrkdwn",
                text: `*Hourly Limit:*\n\`${params.hourlyLimit} emails/hr\``
              },
              {
                type: "mrkdwn",
                text: `*Current Hour Dispatched:*\n\`${params.currentCount} emails\``
              },
              {
                type: "mrkdwn",
                text: `*Window ID:*\n\`${params.hourWindow}\``
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `⏰ *Automated Mitigation Active:* Subsequent jobs for this sender have been automatically paused and rescheduled for the next available hour window at *${params.rescheduledTo.toLocaleTimeString()}* without dropping any messages.`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🔒 ReachInbox Queue Safety System • ${new Date().toISOString()}`
              }
            ]
          }
        ]
      };

      await axios.post(webhookUrl, payload, { timeout: 5000 });
      console.log(`📢 Sent live Slack Rate-Limit alert for sender ${params.senderEmail}`);
      return true;
    } catch (err: any) {
      console.error(`❌ Failed to send Slack alert: ${err.message}`);
      return false;
    }
  }

  static async sendTestMessage(webhookUrl: string): Promise<boolean> {
    try {
      await axios.post(webhookUrl, {
        text: "⚡ *ReachInbox Slack Integration Test*: Your Slack channel is connected and ready to receive real-time rate limit and queue alerts!"
      });
      return true;
    } catch (e: any) {
      throw new Error(`Slack test failed: ${e.message}`);
    }
  }
}
