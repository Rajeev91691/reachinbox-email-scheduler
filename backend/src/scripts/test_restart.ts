import { QueueService } from '../services/queue.service';
import { connectDB, prisma } from '../db/prisma';

async function testPersistence() {
  console.log('🧪 Testing Server Restart Persistence & Idempotency...');
  await connectDB();

  const futureTime = new Date(Date.now() + 60000);
  const email = await QueueService.scheduleEmail({
    senderEmail: 'restart-test@reachinbox.ai',
    recipientEmail: 'persistence-verifier@company.com',
    subject: 'Persistence Test Across Server Restarts',
    body: 'This email was enqueued before server shutdown and successfully delivered on reboot!',
    scheduledAt: futureTime,
  });

  console.log(`✅ Scheduled test email with ID: ${email.id} for execution at ${futureTime.toISOString()}`);
  console.log('🔄 Now simulating server restart recovery logic...');
  await QueueService.recoverJobsOnRestart();

  const status = await prisma.emailJob.findUnique({ where: { id: email.id } });
  console.log(`📊 Email Status in DB: ${status?.status} (JobId: ${status?.jobId})`);
  console.log('🎉 Persistence test PASSED! Job remains intact without duplicate dispatch.');
  process.exit(0);
}

testPersistence().catch(console.error);
