import os

base_dir = r"C:\Users\rajee\Desktop\ReachInbox-Email-Scheduler\backend"

tsconfig = """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}"""

schema = """datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String             @id @default(uuid())
  googleId     String?            @unique
  email        String             @unique
  name         String
  avatarUrl    String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  emails       EmailJob[]
  slackConfig  SlackIntegration?
}

model SenderAccount {
  id           String     @id @default(uuid())
  email        String     @unique
  name         String
  etherealUser String?
  etherealPass String?
  etherealHost String?    @default("smtp.ethereal.email")
  etherealPort Int?       @default(587)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model EmailJob {
  id                 String    @id @default(uuid())
  userId             String?
  user               User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  senderEmail        String
  recipientEmail     String
  subject            String
  body               String
  scheduledAt        DateTime
  status             String    @default("SCHEDULED")
  delaySeconds       Int       @default(2)
  hourlyLimit        Int       @default(200)
  retryCount         Int       @default(0)
  maxRetries         Int       @default(3)
  errorMessage       String?
  sentAt             DateTime?
  etherealMessageId  String?
  etherealPreviewUrl String?
  jobId              String?   @unique
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([status])
  @@index([scheduledAt])
  @@index([senderEmail])
}

model SlackIntegration {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  webhookUrl  String?
  channelName String?
  accessToken String?
  teamName    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RateLimitLog {
  id          String   @id @default(uuid())
  senderEmail String
  hourWindow  String
  emailCount  Int      @default(0)
  limitHit    Boolean  @default(false)
  notifiedAt  DateTime?
  createdAt   DateTime @default(now())

  @@unique([senderEmail, hourWindow])
}
"""

env_content = """# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database (Default SQLite for instant zero-config setup, or postgresql://user:pass@localhost:5432/reachinbox)
DATABASE_URL="file:./dev.db"

# Redis Configuration (BullMQ backend)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
USE_REDIS_MOCK=false

# Worker & Rate Limiting Configurations
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS_SECONDS=2
MAX_EMAILS_PER_HOUR_GLOBAL=1000
MAX_EMAILS_PER_HOUR_PER_SENDER=200

# Elasticsearch Configuration (Optional cluster node or embedded fallback)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=reachinbox_emails

# Authentication (Google OAuth + JWT)
JWT_SECRET=reachinbox_jwt_super_secret_key_2026_internship
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Slack OAuth / Notifications
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/oauth/callback
DEFAULT_SLACK_WEBHOOK_URL=
"""

with open(os.path.join(base_dir, "tsconfig.json"), "w", encoding="utf-8") as f:
    f.write(tsconfig)

with open(os.path.join(base_dir, "prisma", "schema.prisma"), "w", encoding="utf-8") as f:
    f.write(schema)

with open(os.path.join(base_dir, ".env.example"), "w", encoding="utf-8") as f:
    f.write(env_content)

with open(os.path.join(base_dir, ".env"), "w", encoding="utf-8") as f:
    f.write(env_content)

print("Created backend base files successfully!")
