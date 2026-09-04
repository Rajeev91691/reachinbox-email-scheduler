export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface SenderAccount {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}

export type EmailStatus =
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'RATE_LIMITED_DELAYED'
  | 'CANCELLED';

export interface EmailJob {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: EmailStatus;
  delaySeconds: number;
  hourlyLimit: number;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  sentAt?: string;
  etherealMessageId?: string;
  etherealPreviewUrl?: string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  scheduled: number;
  sent: number;
  failed: number;
  rateLimited: number;
  total: number;
}

export interface SlackConfig {
  id: string;
  webhookUrl: string;
  channelName: string;
  isActive: boolean;
}
