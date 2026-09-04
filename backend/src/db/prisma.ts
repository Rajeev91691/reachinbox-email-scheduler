import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ SQLite/PostgreSQL Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
}
