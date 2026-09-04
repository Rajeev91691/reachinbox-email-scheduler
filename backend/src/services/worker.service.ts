import { Worker, Job } from 'bullmq';
import { initRedis } from './redis.service';
import { prisma } from '../db/prisma';
import { EmailService } from './email.service';
import { RateLimiterService } from './rate-limiter.service';
import { ElasticsearchService } from './elasticsearch.service';
import { EMAIL_QUEUE_NAME, EmailJobData, getEmailQueue } from './queue.service';
import { config } from '../config/env';

export class WorkerService {
  private static worker: Worker<EmailJobData> | null = null;

  static async startWorker() {
    if (this.worker) return;

    const redis = await initRedis();
    console.log(`🚀 Starting BullMQ Email Worker (Concurrency: ${config.worker.concurrency})...`);

    this.worker = new Worker<EmailJobData>(
      EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        const { emailJobId, senderEmail, recipientEmail, subject, body, delaySeconds, hourlyLimit, userId } = job.data;

        const emailRecord = await prisma.emailJob.findUnique({
          where: { id: emailJobId }
        });

        if (!emailRecord) {
          console.warn(`[Worker] Job ${emailJobId} not found in DB. Skipping.`);
          return;
        }

        if (emailRecord.status === 'SENT') {
          console.log(`[Worker] Job ${emailJobId} was already sent. Idempotency enforced.`);
          return;
        }

        if (emailRecord.status === 'CANCELLED') {
          console.log(`[Worker] Job ${emailJobId} is cancelled. Skipping.`);
          return;
        }

        const rateCheck = await RateLimiterService.checkAndIncrement(senderEmail, hourlyLimit, userId);

        if (!rateCheck.allowed) {
          console.warn(`⏳ [RateLimit] Sender ${senderEmail} exceeded hourly limit (${rateCheck.currentCount}/${rateCheck.limit}). Rescheduling in ${Math.round(rateCheck.nextWindowDelayMs / 1000)}s...`);

          await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
              status: 'RATE_LIMITED_DELAYED',
              scheduledAt: rateCheck.rescheduledTo,
            }
          });

          const queue = await getEmailQueue();
          const delayedJobId = `job_${emailJobId}_rescheduled_${Date.now()}`;
          await queue.add(
            'send-email',
            {
              ...job.data,
              scheduledAt: rateCheck.rescheduledTo.toISOString(),
            },
            {
              jobId: delayedJobId,
              delay: rateCheck.nextWindowDelayMs,
            }
          );

          await ElasticsearchService.indexEmail({
            ...emailRecord,
            status: 'RATE_LIMITED_DELAYED',
            scheduledAt: rateCheck.rescheduledTo,
          });

          return { status: 'RATE_LIMITED_RESCHEDULED', nextWindow: rateCheck.rescheduledTo };
        }

        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: { status: 'PROCESSING' }
        });

        const throttleDelay = Math.max(delaySeconds || 2, config.worker.minDelaySeconds);
        if (throttleDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, throttleDelay * 1000));
        }

        console.log(`📨 [Worker] Dispatching email to ${recipientEmail} from ${senderEmail}...`);
        const result = await EmailService.sendEmail({
          senderEmail,
          recipientEmail,
          subject,
          body,
        });

        const updatedEmail = await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            etherealMessageId: result.messageId,
            etherealPreviewUrl: result.previewUrl ? String(result.previewUrl) : null,
          }
        });

        await ElasticsearchService.indexEmail(updatedEmail);

        console.log(`✅ [Worker] Sent successfully to ${recipientEmail}! Preview: ${result.previewUrl || 'N/A'}`);
        return {
          status: 'SENT',
          messageId: result.messageId,
          previewUrl: result.previewUrl,
        };
      },
      {
        connection: redis as any,
        concurrency: config.worker.concurrency,
        limiter: {
          max: config.worker.maxEmailsPerHourGlobal,
          duration: 3600000,
        }
      }
    );

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      console.error(`❌ [Worker] Job ${job.id} failed: ${err.message}`);
      try {
        const updated = await prisma.emailJob.update({
          where: { id: job.data.emailJobId },
          data: {
            status: 'FAILED',
            errorMessage: err.message,
            retryCount: { increment: 1 }
          }
        });
        await ElasticsearchService.indexEmail(updated);
      } catch (e) {
        console.warn('Worker failure state DB update error:', e);
      }
    });
  }

  static async stopWorker() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
