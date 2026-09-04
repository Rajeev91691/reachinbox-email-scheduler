import nodemailer from 'nodemailer';
import { prisma } from '../db/prisma';

interface TransporterCache {
  [senderEmail: string]: nodemailer.Transporter;
}

const transporters: TransporterCache = {};

export class EmailService {
  static async getTransporter(senderEmail: string): Promise<{ transporter: nodemailer.Transporter; accountUser: string }> {
    if (transporters[senderEmail]) {
      return { transporter: transporters[senderEmail], accountUser: senderEmail };
    }

    let sender = await prisma.senderAccount.findUnique({
      where: { email: senderEmail }
    });

    if (!sender || !sender.etherealUser || !sender.etherealPass) {
      console.log(`✨ Provisioning Ethereal Email test account for: ${senderEmail}...`);
      const testAccount = await nodemailer.createTestAccount();
      
      sender = await prisma.senderAccount.upsert({
        where: { email: senderEmail },
        update: {
          etherealUser: testAccount.user,
          etherealPass: testAccount.pass,
          etherealHost: testAccount.smtp.host,
          etherealPort: testAccount.smtp.port,
        },
        create: {
          email: senderEmail,
          name: senderEmail.split('@')[0].toUpperCase() + ' SENDER',
          etherealUser: testAccount.user,
          etherealPass: testAccount.pass,
          etherealHost: testAccount.smtp.host,
          etherealPort: testAccount.smtp.port,
        }
      });
      console.log(`📧 Ethereal account ready: ${testAccount.user} for sender ${senderEmail}`);
    }

    const transporter = nodemailer.createTransport({
      host: sender.etherealHost || 'smtp.ethereal.email',
      port: sender.etherealPort || 587,
      secure: sender.etherealPort === 465,
      auth: {
        user: sender.etherealUser!,
        pass: sender.etherealPass!,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    transporters[senderEmail] = transporter;
    return { transporter, accountUser: sender.etherealUser! };
  }

  static async sendEmail(options: {
    senderEmail: string;
    recipientEmail: string;
    subject: string;
    body: string;
  }): Promise<{ messageId: string; previewUrl: string | false }> {
    const { transporter } = await this.getTransporter(options.senderEmail);

    const info = await transporter.sendMail({
      from: `"${options.senderEmail.split('@')[0]}" <${options.senderEmail}>`,
      to: options.recipientEmail,
      subject: options.subject,
      text: options.body,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
        <h2 style="color: #4f46e5; margin-bottom: 12px;">ReachInbox Outreach</h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          ${options.body.replace(/\n/g, '<br/>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">
          Sent via ReachInbox High-Throughput Email Scheduler • Outbox Labs
        </p>
      </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      messageId: info.messageId,
      previewUrl: previewUrl || false,
    };
  }
}
