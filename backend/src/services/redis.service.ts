import Redis from 'ioredis';
import { config } from '../config/env';

let redisClient: Redis;
let redisMemoryServer: any = null;

export async function initRedis(): Promise<Redis> {
  if (redisClient) return redisClient;

  try {
    // Attempt connecting to configured Redis
    const testClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      lazyConnect: true,
    });

    await testClient.connect();
    console.log(`✅ Redis connected at ${config.redis.host}:${config.redis.port}`);
    redisClient = testClient;
    return redisClient;
  } catch (err) {
    console.log('ℹ️ Local standalone Redis not found. Initializing embedded high-performance Redis engine...');
    try {
      const { RedisMemoryServer } = require('redis-memory-server');
      redisMemoryServer = new RedisMemoryServer();
      const host = await redisMemoryServer.getHost();
      const port = await redisMemoryServer.getPort();

      redisClient = new Redis({
        host,
        port,
        maxRetriesPerRequest: null,
      });

      console.log(`✅ Embedded Redis Server active on ${host}:${port}`);
      return redisClient;
    } catch (memErr) {
      console.warn('⚠️ Embedded Redis fallback notice, using direct connection:', memErr);
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null,
      });
      return redisClient;
    }
  }
}

// Fallback client for immediate export
export const redisClientProxy = new Proxy({} as Redis, {
  get(target, prop, receiver) {
    if (!redisClient) {
      // Lazy fallback
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null,
      });
    }
    const val = (redisClient as any)[prop];
    return typeof val === 'function' ? val.bind(redisClient) : val;
  }
});

export { redisClientProxy as redisClient };
