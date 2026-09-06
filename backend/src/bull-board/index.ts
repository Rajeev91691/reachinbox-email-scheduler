import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getEmailQueue } from '../services/queue.service';
import { Router } from 'express';

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

let boardInitialized = false;

export async function initBullBoard() {
  if (boardInitialized) return;
  const queue = await getEmailQueue();
  createBullBoard({
    queues: [new BullMQAdapter(queue as any) as any],
    serverAdapter: serverAdapter,
  });
  boardInitialized = true;
}

export function setupBullBoard(): Router {
  initBullBoard().catch(console.error);
  return serverAdapter.getRouter();
}

