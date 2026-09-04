import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getEmailQueue } from '../services/queue.service';
import { Router } from 'express';

export function setupBullBoard(): Router {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  getEmailQueue().then((queue) => {
    createBullBoard({
      queues: [new BullMQAdapter(queue as any) as any],
      serverAdapter: serverAdapter,
    });
  });

  return serverAdapter.getRouter();
}
