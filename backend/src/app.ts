import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';
import { setupBullBoard } from './bull-board';

export const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ReachInbox High-Throughput Email Scheduler',
    timestamp: new Date().toISOString(),
  });
});

app.use('/admin/queues', setupBullBoard());
app.use('/api', apiRouter);
