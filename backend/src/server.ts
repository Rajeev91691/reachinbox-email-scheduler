import { app } from './app';
import { config } from './config/env';
import { connectDB } from './db/prisma';
import { initRedis } from './services/redis.service';
import { WorkerService } from './services/worker.service';
import { QueueService } from './services/queue.service';
import { initBullBoard } from './bull-board';

async function bootstrap() {
  console.log('──────────────────────────────────────────────────────────');
  console.log('🚀 Initializing ReachInbox Email Job Scheduler Platform');
  console.log('──────────────────────────────────────────────────────────');

  await connectDB();
  await initRedis();
  await initBullBoard();
  await WorkerService.startWorker();
  await QueueService.recoverJobsOnRestart();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`🌐 Server running on: http://localhost:${config.port}`);
    console.log(`📊 BullMQ Live Dashboard: http://localhost:${config.port}/admin/queues`);
    console.log(`🔍 Elasticsearch Search: http://localhost:${config.port}/api/search`);
    console.log('──────────────────────────────────────────────────────────');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Initialization Error:', err);
  process.exit(1);
});
