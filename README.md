# 🚀 ReachInbox • Production-Grade Distributed Email Job Scheduler

[![Live Demo](https://img.shields.io/badge/Live_Demo-reachbox--pi.vercel.app-00A34D?style=for-the-badge&logo=vercel&logoColor=white)](https://reachbox-pi.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub_Repo-Rajeev91691-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Rajeev91691/reachinbox-email-scheduler)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![BullMQ](https://img.shields.io/badge/BullMQ-E10098?style=for-the-badge&logo=redis&logoColor=white)](https://docs.bullmq.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> 🌐 **Live Deployed URL**: **[https://reachbox-pi.vercel.app](https://reachbox-pi.vercel.app)**
> 🔗 **Preview URL**: **[https://reachbox-qsl88ngq6-rajeevnandan382-5340s-projects.vercel.app](https://reachbox-qsl88ngq6-rajeevnandan382-5340s-projects.vercel.app)**

A fault-tolerant, high-throughput email scheduling engine and real-time dashboard built for **ReachInbox.ai (Outbox Labs)**. Designed to reliably schedule, throttle, persist, and dispatch cold email sequences across multiple senders using Redis-backed BullMQ delayed queues, fake Ethereal SMTP transports, Elasticsearch indexing, and Slack rate-limit mitigations.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Key Highlights & Requirements Checklist](#-key-highlights--requirements-checklist)
3. [Core Technical Mechanics](#-core-technical-mechanics)
   - [Persistent Delayed Queue (No Cron)](#1-persistent-delayed-queue-strictly-no-cron)
   - [Restart Persistence & Idempotency](#2-server-restart-persistence--idempotency)
   - [Worker Concurrency & Minimum Delays](#3-worker-concurrency--throttle-delays)
   - [Distributed Hourly Rate Limiter](#4-distributed-hourly-rate-limiter-per-sender)
   - [Live Slack Webhook / OAuth Alerts](#5-live-slack-rate-limit-alerts)
   - [Elasticsearch Indexing & Search](#6-elasticsearch-indexing--search)
   - [Live BullMQ Dashboard](#7-live-bullmq-queue-dashboard)
4. [Project Structure](#-project-structure)
5. [Quickstart & Step-by-Step Setup](#-quickstart--step-by-step-setup)
6. [Demo & Testing Scripts](#-demo--testing-scripts)
7. [Submission Details](#-submission-details)

---

## 🏛️ Architecture Overview

```
                          ┌────────────────────────┐
                          │   Next.js / React UI   │
                          │   (Tailwind + Lucide)  │
                          └───────────┬────────────┘
                                      │ REST API / JWT
                                      ▼
                        ┌───────────────────────────┐
                        │    Express.js Backend     │
                        │   (TypeScript + Zod)      │
                        └───────┬───────────┬───────┘
                                │           │
              ┌─────────────────┴─┐       ┌─┴─────────────────┐
              ▼                   ▼       ▼                   ▼
    ┌──────────────────┐   ┌────────────┐┌──────────────┐   ┌───────────────┐
    │  Relational DB   │   │   BullMQ   ││Elasticsearch │   │ Ethereal SMTP │
    │ (SQLite/Postgres)│   │  (Redis)   ││(Search Engine│   │ (Fake Inbox)  │
    └──────────────────┘   └─────┬──────┘└──────────────┘   └───────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        ┌───────────────────────┐   ┌────────────────────────┐
        │  BullMQ Worker Pool   │──►│ Live Slack Alert Hooks │
        │ (Concurrency + Throttle│   │  (Rate Limit Mitigate) │
        └───────────────────────┘   └────────────────────────┘
```

---

## ✅ Key Highlights & Requirements Checklist

| Requirement | Implementation Status | Technical Solution |
| :--- | :---: | :--- |
| **No Cron Jobs** | ✅ Pass | BullMQ native timestamp delayed jobs (`delay: targetTime - Date.now()`). Zero `node-cron`, zero OS crontab. |
| **Restart Persistence** | ✅ Pass | `recoverJobsOnRestart()` audits DB states on startup and re-enqueues missing delayed jobs. |
| **Idempotency** | ✅ Pass | Deterministic job IDs (`jobId: "job_" + emailJob.id`) + DB status guard prevent duplicate dispatch. |
| **Worker Concurrency** | ✅ Pass | Configurable pool concurrency (`WORKER_CONCURRENCY=5`) executing jobs in parallel. |
| **Minimum Delay Between Emails** | ✅ Pass | Configurable throttle delay (`MIN_DELAY_BETWEEN_EMAILS_SECONDS=2`) between sends. |
| **Hourly Rate Limiter** | ✅ Pass | Atomic Redis fixed-window counters (`ratelimit:{sender}:{hourWindow}`). Auto-reschedules into next hour. |
| **Live Slack Notifications** | ✅ Pass | Automated real-time Slack webhook dispatch when sender hits hourly rate limit. |
| **Multi-Sender Ethereal SMTP** | ✅ Pass | Per-sender SMTP transport cache with real-time test web preview URL generation. |
| **Elasticsearch Search** | ✅ Pass | Full indexing of subject, body, recipient, sender with cluster connection + embedded memory fallback. |
| **BullMQ Live Monitor** | ✅ Pass | `@bull-board/express` mounted live on `/admin/queues`. |
| **Google OAuth & Dev Login** | ✅ Pass | Real Google OAuth token verification with 1-click evaluation bypass for reviewers. |
| **CSV / TXT Lead Upload** | ✅ Pass | Multi-recipient batch parser with instant lead count detection and schedule calculation. |

---

## ⚙️ Core Technical Mechanics

### 1. Persistent Delayed Queue (Strictly No Cron)
When an email is scheduled for a future timestamp $T$, the backend calculates the exact millisecond offset:
$$\Delta t = \max(0, T_{\text{scheduled}} - T_{\text{now}})$$
The job is inserted into Redis via BullMQ's delayed zset. Redis maintains timer offsets natively without spinning background polling intervals or cron tasks.

### 2. Server Restart Persistence & Idempotency
1. Every scheduling request writes the record to the relational database before enqueuing to Redis.
2. If the server crashes or restarts, `QueueService.recoverJobsOnRestart()` scans for pending `SCHEDULED` or `RATE_LIMITED_DELAYED` records.
3. It compares them against Redis and re-enqueues only missing jobs with remaining delays.
4. Before dispatching, the worker validates `emailRecord.status !== 'SENT'` and rejects duplicates, guaranteeing exactly-once delivery.

### 3. Worker Concurrency & Throttle Delays
- Workers are spun up with configurable concurrency (`WORKER_CONCURRENCY`, default `5`).
- To mimic real-world SMTP provider throttling and protect sender reputation, workers enforce an asynchronous delay (`delaySeconds` or `minDelaySeconds`, default `2s`) prior to `transporter.sendMail()`.

### 4. Distributed Hourly Rate Limiter (Per-Sender)
- Hourly windows are keyed by ISO hour (e.g. `ratelimit:sales@reachinbox.ai:2026-09-04T18:00:00.000Z`).
- Each dispatch executes an atomic `INCR` in Redis with a 2-hour TTL.
- If `currentCount > hourlyLimit`:
  - The job is **not dropped or failed**.
  - Its status is updated to `RATE_LIMITED_DELAYED`.
  - It is automatically re-enqueued with a delay targeting the start of the next hour window $+ 5\text{s}$ buffer.

### 5. Live Slack Rate-Limit Alerts
- When a sender crosses their hourly quota for the first time in a given window, `SlackService.notifyRateLimitHit()` fires a structured Slack Block Kit message to the connected webhook with the sender email, limit count, and target mitigation time.

### 6. Elasticsearch Indexing & Search
- All scheduled, sent, and failed emails are indexed in Elasticsearch (`reachinbox_emails`).
- Full-text queries search across `subject^3`, `recipientEmail^2`, `senderEmail^2`, and `body` with fuzzy matching.
- An embedded in-memory inverted index fallback ensures instant search functionality even if an external Elasticsearch cluster is not running.

### 7. Live BullMQ Queue Dashboard
- Access real-time queue states, active jobs, delayed counts, completed items, and failed stack traces at `http://localhost:5000/admin/queues`.

---

## 📂 Project Structure

```
ReachInbox-Email-Scheduler/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Relational DB Schema (User, EmailJob, SenderAccount, Slack)
│   ├── src/
│   │   ├── config/env.ts         # Environment configuration and defaults
│   │   ├── db/prisma.ts          # Singleton Prisma database client
│   │   ├── services/
│   │   │   ├── redis.service.ts  # Redis connection & embedded server fallback
│   │   │   ├── queue.service.ts  # BullMQ delayed scheduler & persistence recovery
│   │   │   ├── worker.service.ts # BullMQ Worker pool, rate limit handler & SMTP dispatcher
│   │   │   ├── rate-limiter.service.ts # Distributed Redis hourly counter
│   │   │   ├── email.service.ts  # Multi-sender Ethereal SMTP transporter & preview generator
│   │   │   ├── slack.service.ts  # Slack webhook & OAuth alert dispatcher
│   │   │   ├── elasticsearch.service.ts # Elasticsearch indexing & multi-field search
│   │   │   └── auth.service.ts   # Google OAuth token verification & JWT issuance
│   │   ├── controllers/          # Express API controllers
│   │   ├── routes/api.ts         # REST API routes
│   │   ├── bull-board/index.ts   # Live BullMQ Express monitor
│   │   ├── scripts/
│   │   │   ├── simulate_load.ts  # 1000+ batch email load & rate-limit simulator
│   │   │   └── test_restart.ts   # Crash-persistence & recovery verification test
│   │   ├── app.ts                # Express application definition
│   │   └── server.ts             # Server initialization bootstrap
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Top header with user profile, BullMQ link & Slack badge
│   │   │   ├── StatsCards.tsx    # Live metric cards (Scheduled, Sent, Throttled, Failed)
│   │   │   ├── ComposeModal.tsx  # Compose modal with CSV lead uploader & throttle sliders
│   │   │   ├── ScheduledTable.tsx# Scheduled jobs table with cancel actions
│   │   │   ├── SentTable.tsx     # Sent emails table with Ethereal preview links
│   │   │   ├── SlackModal.tsx    # Slack webhook connector and alert tester
│   │   │   └── LoginView.tsx     # Google OAuth / Reviewer dev login
│   │   ├── context/AuthContext.tsx # User session and authentication state
│   │   ├── services/api.ts       # Axios client with interceptors
│   │   ├── types/index.ts        # TypeScript interfaces
│   │   ├── App.tsx               # Main Dashboard view
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── sample_leads.csv              # Sample CSV leads file for testing
├── sample_leads.txt              # Sample TXT leads file for testing
├── docker-compose.yml            # Containerized PostgreSQL, Redis, Elasticsearch
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Step-by-Step Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **npm** or **yarn**

### 1. Clone & Install Dependencies
```bash
# Navigate to the project directory
cd ReachInbox-Email-Scheduler

# Install backend dependencies
cd backend
npm install
npx prisma db push

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables (Optional)
The backend comes preconfigured with zero-config defaults (`backend/.env`). You can customize parameters as needed:
```env
PORT=5000
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@localhost:5432/reachinbox
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS_SECONDS=2
MAX_EMAILS_PER_HOUR_PER_SENDER=200
DEFAULT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Start Backend & Frontend
In terminal 1 (Backend):
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`*
*Live BullMQ Dashboard: `http://localhost:5000/admin/queues`*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🧪 Demo & Testing Scripts

### 1. Verify Server Restart Persistence
Simulates scheduling a future delayed job, shutting down, and running restart recovery:
```bash
cd backend
npm run test:restart
```

### 2. High-Throughput Load & Rate Limit Simulation
Schedules a batch of 100 emails with a 20 emails/hour limit to trigger rate-limiting, job rescheduling, and Slack notification:
```bash
cd backend
npm run simulate
```

### 3. Test CSV Lead Upload from UI
1. Open `http://localhost:3000`.
2. Click **Enter Evaluation Dashboard**.
3. Click **Compose New Email**.
4. Drag & drop [`sample_leads.csv`](file:///C:/Users/rajee/Desktop/ReachInbox-Email-Scheduler/sample_leads.csv).
5. Watch the real-time parser detect the 10 leads, set custom delay, and schedule the batch!

---

## 🎨 UI Architecture & Design Alignment

The frontend is an exact 1:1 pixel implementation matching the Outbox Labs Figma specification:
- **Authentication**: Google OAuth popup flow and fast evaluation presets.
- **Brand System**: Minimalist pure white background (`#FFFFFF`), ReachInbox brand green (`#00A34D`), and mint recipient pills (`#E8F8F0`).
- **Compose System**: Dynamic multi-recipient tagging, CSV drag-and-drop parser, custom delay sliders, and rich text formatting.
- **Scheduling Popover**: Exact datetime picker with quick presets (*Tomorrow 10:00 AM, 11:00 AM, 3:00 PM*).
- **Thread Viewer**: Full conversational view with sender initial avatars, recipient chips, and yellow note callouts.
- **Live Preview**: Integrated Ethereal SMTP viewer links on sent dispatches.

---

## 📬 Submission Details

- **Author**: Damarla Rajeev Nandan
- **Contact**: `rajeevnandan382@gmail.com` | `+91 9481509488`
- **Live Deployed URL**: **[https://reachbox-pi.vercel.app](https://reachbox-pi.vercel.app)**
- **GitHub Repository**: [https://github.com/Rajeev91691/reachinbox-email-scheduler](https://github.com/Rajeev91691/reachinbox-email-scheduler)
- **Invited Reviewers**: `Mitrajit` (`mitrajit2022@gmail.com`) and `Yadav036` (`yadav036@gmail.com`)
- **Official Submission Form**: [ClickUp Submission Portal](https://forms.clickup.com/9005062261/f/8cbwp3n-8876/6NNNJ92DV93PQTAYST)


