import { QueueService } from '../services/queue.service';
import { connectDB } from '../db/prisma';
import { WorkerService } from '../services/worker.service';

async function runSimulation() {
  console.log('⚡ Starting ReachInbox 1000+ Email High-Throughput Load Simulation...');
  await connectDB();
  WorkerService.startWorker();

  const totalEmails = 100;
  const senderEmail = 'cold-outreach-pro@reachinbox.ai';
  const recipients = Array.from({ length: totalEmails }, (_, i) => `lead_${i + 1}@prospective-client.com`);

  console.log(`📦 Enqueuing batch of ${totalEmails} emails for sender: ${senderEmail}`);
  console.log(`⚙️ Rate limit set to 20 emails/hr for quick demo trigger`);

  const startTime = new Date();
  const jobs = await QueueService.scheduleBatch({
    senderEmail,
    recipients,
    subject: 'Transform your cold outreach with ReachInbox AI',
    body: 'Hi {{email}},\n\nReachInbox automates your lead generation with AI-driven sequences.',
    startTime,
    delayBetweenEmailsSeconds: 1,
    hourlyLimit: 20,
  });

  console.log(`✅ Successfully scheduled ${jobs.length} emails into BullMQ delayed queue!`);
  console.log('👀 Check http://localhost:5000/admin/queues to watch real-time dispatching and rate-limit mitigation.');
}

runSimulation().catch(console.error);
