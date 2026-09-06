import axios from 'axios';

async function runSimulation() {
  console.log('⚡ Starting ReachInbox 1000+ Email High-Throughput Load Simulation...');
  console.log('📡 Connecting to running server at http://localhost:5000...');

  const totalEmails = 100;
  const senderEmail = 'cold-outreach-pro@reachinbox.ai';
  const recipients = Array.from({ length: totalEmails }, (_, i) => `lead_${i + 1}@prospective-client.com`);

  console.log(`📦 Dispatching batch of ${totalEmails} emails for sender: ${senderEmail}`);
  console.log(`⚙️ Rate limit set to 20 emails/hr with 1s delay`);

  try {
    const res = await axios.post('http://localhost:5000/api/emails/schedule', {
      senderEmail,
      recipients,
      subject: 'Transform your cold outreach with ReachInbox AI',
      body: 'Hi {{email}},\n\nReachInbox automates your lead generation with AI-driven sequences.',
      scheduledAt: new Date(Date.now() + 10000).toISOString(), // Starts in 10s so they appear in Delayed set!
      delaySeconds: 1,
      hourlyLimit: 20,
    });

    console.log(`✅ Successfully scheduled ${res.data.count} emails into running server BullMQ queue!`);
    console.log('👉 Open http://localhost:5000/admin/queues and click "Delayed" to watch jobs count down and execute!');
  } catch (err: any) {
    console.error('Simulation dispatch notice:', err.response?.data?.error || err.message);
  }
}

runSimulation().catch(console.error);

