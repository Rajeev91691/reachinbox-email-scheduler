import { Queue } from 'bullmq';
import { initRedis, redisClient } from './redis.service';
import { prisma } from '../db/prisma';
import { ElasticsearchService } from './elasticsearch.service';

export interface EmailJobData {
  emailJobId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  delaySeconds: number;
  hourlyLimit: number;
  userId?: string;
}

export const EMAIL_QUEUE_NAME = 'reachinbox-email-dispatch-queue';

let queueInstance: Queue<EmailJobData> | null = null;

export async function getEmailQueue(): Promise<Queue<EmailJobData>> {
  if (queueInstance) return queueInstance;
  const client = await initRedis();
  queueInstance = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: client as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  });
  return queueInstance;
}

export class QueueService {
  static async scheduleEmail(data: {
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
    scheduledAt: Date;
    delaySeconds?: number;
    hourlyLimit?: number;
    userId?: string;
  }) {
    const delaySeconds = data.delaySeconds ?? 2;
    const hourlyLimit = data.hourlyLimit ?? 200;

    let validUserId: string | null = null;
    if (data.userId) {
      try {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (user) {
          validUserId = user.id;
        }
      } catch (e) {
        validUserId = null;
      }
    }

    const emailJob = await prisma.emailJob.create({
      data: {
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        body: data.body,
        scheduledAt: data.scheduledAt,
        delaySeconds,
        hourlyLimit,
        userId: validUserId,
        status: 'SCHEDULED',
      }
    });

    const now = Date.now();
    const targetTime = new Date(data.scheduledAt).getTime();
    const delayMs = Math.max(0, targetTime - now);

    const queue = await getEmailQueue();
    const job = await queue.add(
      'send-email',
      {
        emailJobId: emailJob.id,
        senderEmail: data.senderEmail,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        body: data.body,
        scheduledAt: data.scheduledAt.toISOString(),
        delaySeconds,
        hourlyLimit,
        userId: data.userId,
      },
      {
        jobId: `job_${emailJob.id}`,
        delay: delayMs,
      }
    );

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { jobId: job.id }
    });

    await ElasticsearchService.indexEmail(emailJob);
    return emailJob;
  }

  static async scheduleBatch(params: {
    senderEmail: string;
    recipients: string[];
    subject: string;
    body: string;
    startTime: Date;
    delayBetweenEmailsSeconds: number;
    hourlyLimit: number;
    userId?: string;
  }) {
    const {
      senderEmail,
      recipients,
      subject,
      body,
      startTime,
      delayBetweenEmailsSeconds,
      hourlyLimit,
      userId,
    } = params;

    const scheduledJobs = [];
    let currentScheduleTime = new Date(startTime).getTime();

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].trim();
      if (!recipient) continue;

      const personalizedBody = body.replace(/{{email}}/g, recipient);
      const scheduledAt = new Date(currentScheduleTime);

      const job = await this.scheduleEmail({
        senderEmail,
        recipientEmail: recipient,
        subject,
        body: personalizedBody,
        scheduledAt,
        delaySeconds: delayBetweenEmailsSeconds,
        hourlyLimit,
        userId,
      });

      scheduledJobs.push(job);
      currentScheduleTime += delayBetweenEmailsSeconds * 1000;
    }

    return scheduledJobs;
  }

  static async cancelEmail(id: string) {
    const emailJob = await prisma.emailJob.findUnique({ where: { id } });
    if (!emailJob) throw new Error('Email job not found');

    if (emailJob.status === 'SENT') {
      throw new Error('Cannot cancel an already sent email');
    }

    const queue = await getEmailQueue();
    if (emailJob.jobId) {
      const job = await queue.getJob(emailJob.jobId);
      if (job) {
        await job.remove();
      }
    }

    const updated = await prisma.emailJob.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await ElasticsearchService.indexEmail(updated);
    return updated;
  }

  static async recoverJobsOnRestart() {
    console.log('🔄 Checking database for pending scheduled jobs to ensure restart persistence...');
    const pendingJobs = await prisma.emailJob.findMany({
      where: {
        status: { in: ['SCHEDULED', 'QUEUED', 'RATE_LIMITED_DELAYED'] }
      }
    });

    const queue = await getEmailQueue();
    let recovered = 0;
    for (const email of pendingJobs) {
      const expectedJobId = `job_${email.id}`;
      const existingJob = await queue.getJob(expectedJobId);

      if (!existingJob) {
        const delayMs = Math.max(0, new Date(email.scheduledAt).getTime() - Date.now());
        await queue.add(
          'send-email',
          {
            emailJobId: email.id,
            senderEmail: email.senderEmail,
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            body: email.body,
            scheduledAt: email.scheduledAt.toISOString(),
            delaySeconds: email.delaySeconds,
            hourlyLimit: email.hourlyLimit,
            userId: email.userId || undefined,
          },
          {
            jobId: expectedJobId,
            delay: delayMs,
          }
        );
        recovered++;
      }
    }
    console.log(`✅ Persistence verified: ${recovered} scheduled jobs verified/re-enqueued in BullMQ.`);
  }
}
