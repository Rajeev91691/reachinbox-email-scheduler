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

export const authApi = {
  loginWithGoogle: async (idToken: string): Promise<{ user: User; token: string }> => {
    const res = await api.post('/auth/google', { idToken });
    return res.data;
  },
  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
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
    const res = await api.post('/emails/schedule', data);
    return res.data;
  },

  uploadCsv: async (file: File): Promise<{ success: boolean; count: number; emails: string[]; preview: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/emails/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getScheduled: async (page = 1, limit = 50, status?: string): Promise<{ items: EmailJob[]; total: number }> => {
    const res = await api.get('/emails/scheduled', { params: { page, limit, status } });
    return res.data;
  },

  getSent: async (page = 1, limit = 50, status?: string): Promise<{ items: EmailJob[]; total: number }> => {
    const res = await api.get('/emails/sent', { params: { page, limit, status } });
    return res.data;
  },

  cancel: async (id: string): Promise<{ success: boolean; job: EmailJob }> => {
    const res = await api.delete(`/emails/${id}`);
    return res.data;
  },

  getSenders: async (): Promise<{ senders: SenderAccount[] }> => {
    const res = await api.get('/emails/senders');
    return res.data;
  },

  getStats: async (): Promise<EmailStats> => {
    const res = await api.get('/emails/stats');
    return res.data;
  },

  search: async (q: string, status = 'ALL'): Promise<{ query: string; count: number; results: EmailJob[] }> => {
    const res = await api.get('/search', { params: { q, status } });
    return res.data;
  }
};

export const slackApi = {
  connect: async (webhookUrl: string, channelName?: string): Promise<{ success: boolean; slack: SlackConfig }> => {
    const res = await api.post('/slack/connect', { webhookUrl, channelName });
    return res.data;
  },
  testNotification: async (webhookUrl?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/slack/test', { webhookUrl });
    return res.data;
  },
  getStatus: async (): Promise<{ connected: boolean; slack?: SlackConfig }> => {
    const res = await api.get('/slack/status');
    return res.data;
  }
};
