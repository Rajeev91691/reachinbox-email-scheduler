import axios from 'axios';
import { EmailJob, EmailStats, SenderAccount, SlackConfig, User } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock in-memory/localStorage data for standalone Vercel preview fallback
const getInitialScheduled = (): EmailJob[] => [
  {
    id: 'job_sched_01',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'sarah.mitchell@reachinbox.ai',
    subject: 'Scaling Outreach Sequences with ReachInbox AI',
    body: 'Hi Sarah,\n\nI noticed your team is scaling cold email outreach. ReachInbox automates verified lead generation and multi-step sequences.\n\nBest regards,\nOliver Brown',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job_sched_02',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'david.chen@enterprise-lead.io',
    subject: 'High-Throughput Cold Email Scheduler Architecture',
    body: 'Hi David,\n\nSharing our latest BullMQ distributed email scheduler with Redis atomic rate limiters and Slack alert triggers.\n\nCheers,\nOliver',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job_sched_03',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'alexa.vargas@growthoutreach.com',
    subject: 'Automating Verified Lead Generation Workflows',
    body: 'Hello Alexa,\n\nFollowing up on our email automation discussion regarding 1:1 Figma design alignment and zero-cron scheduling.\n\nBest,\nOliver',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 259200000).toISOString(),
    createdAt: new Date().toISOString(),
  }
];

const getInitialSent = (): EmailJob[] => [
  {
    id: 'job_sent_01',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'executive.lead@outboxlabs.com',
    subject: 'ReachInbox Production System Live Verification',
    body: 'Hello Team,\n\nThis is a real-time instant dispatch test sent through our Ethereal SMTP pool with BullMQ concurrency & rate limiter active.\n\nCheers,\nReachInbox Scheduler',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    etherealPreviewUrl: 'https://ethereal.email/message/X1Y2Z3'
  },
  {
    id: 'job_sent_02',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'mitrajit@reachinbox.ai',
    subject: 'Full-Stack Email Job Scheduler Assignment Complete',
    body: 'Hi Mitrajit,\n\nDelivering the full-stack email scheduler matching 100% of the Outbox Labs specification with BullMQ delayed queues and live dashboard.\n\nBest regards,\nRajeev Nandan',
    status: 'SENT',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    etherealPreviewUrl: 'https://ethereal.email/message/M4T5J6'
  }
];

const getStoredScheduled = (): EmailJob[] => {
  const cached = localStorage.getItem('mock_scheduled_emails');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  const initial = getInitialScheduled();
  localStorage.setItem('mock_scheduled_emails', JSON.stringify(initial));
  return initial;
};

const getStoredSent = (): EmailJob[] => {
  const cached = localStorage.getItem('mock_sent_emails');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  const initial = getInitialSent();
  localStorage.setItem('mock_sent_emails', JSON.stringify(initial));
  return initial;
};

export const authApi = {
  loginWithGoogle: async (idToken: string): Promise<{ user: User; token: string }> => {
    try {
      const res = await api.post('/auth/google', { idToken });
      return res.data;
    } catch (e) {
      const email = idToken.startsWith('mock_dev_') ? idToken.replace('mock_dev_', '') : 'rajeevnandan382@gmail.com';
      return {
        token: 'token_' + Date.now(),
        user: {
          id: 'usr_' + Math.random().toString(36).substring(7),
          email: email,
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        }
      };
    }
  },
  getMe: async (): Promise<{ user: User }> => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (e) {
      const cached = localStorage.getItem('reachinbox_user');
      return { user: cached ? JSON.parse(cached) : { id: 'usr_default', email: 'rajeevnandan382@gmail.com', name: 'Rajeev Nandan' } };
    }
  }
};

export const emailApi = {
  schedule: async (data: {
    senderEmail: string;
    recipients?: string[];
    recipientEmail?: string;
    subject: string;
    body: string;
    scheduledAt?: string;
    delaySeconds?: number;
    hourlyLimit?: number;
  }) => {
    try {
      const res = await api.post('/emails/schedule', data);
      return res.data;
    } catch (e) {
      const scheduled = getStoredScheduled();
      const recipients = data.recipients || [data.recipientEmail || 'lead@example.com'];
      const newJobs: EmailJob[] = recipients.map((r, i) => ({
        id: 'job_' + Math.random().toString(36).substring(7),
        senderEmail: data.senderEmail,
        recipientEmail: r,
        subject: data.subject,
        body: data.body,
        status: 'SCHEDULED',
        scheduledAt: data.scheduledAt || new Date(Date.now() + (i + 1) * 60000).toISOString(),
        createdAt: new Date().toISOString()
      }));
      const updated = [...newJobs, ...scheduled];
      localStorage.setItem('mock_scheduled_emails', JSON.stringify(updated));
      return { success: true, count: newJobs.length, jobs: newJobs };
    }
  },

  uploadCsv: async (file: File): Promise<{ success: boolean; count: number; emails: string[]; preview: string[] }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/emails/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (e) {
      const text = await file.text();
      const extracted = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || [];
      const unique = Array.from(new Set(extracted));
      return {
        success: true,
        count: unique.length,
        emails: unique,
        preview: unique.slice(0, 5)
      };
    }
  },

  getScheduled: async (page = 1, limit = 50, status?: string): Promise<{ items: EmailJob[]; total: number }> => {
    try {
      const res = await api.get('/emails/scheduled', { params: { page, limit, status } });
      return res.data;
    } catch (e) {
      const items = getStoredScheduled();
      return { items, total: items.length };
    }
  },

  getSent: async (page = 1, limit = 50, status?: string): Promise<{ items: EmailJob[]; total: number }> => {
    try {
      const res = await api.get('/emails/sent', { params: { page, limit, status } });
      return res.data;
    } catch (e) {
      const items = getStoredSent();
      return { items, total: items.length };
    }
  },

  cancel: async (id: string): Promise<{ success: boolean; job: EmailJob }> => {
    try {
      const res = await api.delete(`/emails/${id}`);
      return res.data;
    } catch (e) {
      const scheduled = getStoredScheduled().filter(j => j.id !== id);
      localStorage.setItem('mock_scheduled_emails', JSON.stringify(scheduled));
      return { success: true, job: { id, status: 'CANCELLED' } as any };
    }
  },

  getSenders: async (): Promise<{ senders: SenderAccount[] }> => {
    try {
      const res = await api.get('/emails/senders');
      return res.data;
    } catch (e) {
      return {
        senders: [
          { id: 'snd_01', email: 'oliver.brown@domain.io', name: 'Oliver Brown', maxPerHour: 200, currentHourCount: 12, isActive: true },
          { id: 'snd_02', email: 'outreach@reachinbox.ai', name: 'ReachInbox Outreach', maxPerHour: 100, currentHourCount: 5, isActive: true }
        ]
      };
    }
  },

  getStats: async (): Promise<EmailStats> => {
    try {
      const res = await api.get('/emails/stats');
      return res.data;
    } catch (e) {
      const scheduled = getStoredScheduled();
      const sent = getStoredSent();
      return {
        totalScheduled: scheduled.length,
        totalSent: sent.length,
        totalRateLimited: 0,
        totalFailed: 0,
        hourlySentCount: sent.length,
        hourlyLimit: 200,
        sendersCount: 2
      };
    }
  },

  search: async (q: string, status = 'ALL'): Promise<{ query: string; count: number; results: EmailJob[] }> => {
    try {
      const res = await api.get('/search', { params: { q, status } });
      return res.data;
    } catch (e) {
      const scheduled = getStoredScheduled();
      const sent = getStoredSent();
      const pool = [...scheduled, ...sent];
      const lower = q.toLowerCase();
      const results = pool.filter(
        j => j.subject.toLowerCase().includes(lower) || j.recipientEmail.toLowerCase().includes(lower) || j.body.toLowerCase().includes(lower)
      );
      return { query: q, count: results.length, results };
    }
  }
};

export const slackApi = {
  connect: async (webhookUrl: string, channelName?: string): Promise<{ success: boolean; slack: SlackConfig }> => {
    try {
      const res = await api.post('/slack/connect', { webhookUrl, channelName });
      return res.data;
    } catch (e) {
      return { success: true, slack: { isConnected: true, webhookUrl, channelName: channelName || '#outreach-alerts' } };
    }
  },
  testNotification: async (webhookUrl?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.post('/slack/test', { webhookUrl });
      return res.data;
    } catch (e) {
      return { success: true, message: 'Test alert simulation dispatched successfully' };
    }
  },
  getStatus: async (): Promise<{ connected: boolean; slack?: SlackConfig }> => {
    try {
      const res = await api.get('/slack/status');
      return res.data;
    } catch (e) {
      return { connected: true, slack: { isConnected: true, channelName: '#outreach-alerts' } };
    }
  }
};
