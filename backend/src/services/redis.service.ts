import Redis from 'ioredis';
import { config } from '../config/env';

let redisClient: Redis | null = null;
let redisMemoryServer: any = null;
let initPromise: Promise<Redis> | null = null;

export async function initRedis(): Promise<Redis> {
  if (redisClient) return redisClient;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Attempt probing configured external Redis
      const testClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
        connectTimeout: 1000,
        lazyConnect: true,
        retryStrategy: () => null, // Do not auto-reconnect if offline
      });

      testClient.on('error', () => {
        // Silently capture probe errors
      });

      await testClient.connect();
      console.log(`✅ Standalone Redis connected at ${config.redis.host}:${config.redis.port}`);
      redisClient = testClient;
      return redisClient;
    } catch (err) {
      console.log('ℹ️ Local standalone Redis not found. Initializing embedded high-performance Redis engine...');
      try {
        const { RedisMemoryServer } = require('redis-memory-server');
        redisMemoryServer = new RedisMemoryServer();
        const host = await redisMemoryServer.getHost();
        const port = await redisMemoryServer.getPort();

        config.redis.host = host;
        config.redis.port = port;

        const embeddedClient = new Redis({
          host,
          port,
          maxRetriesPerRequest: null,
        });

        embeddedClient.on('error', (e) => {
          console.warn('Embedded Redis notice:', e.message);
        });

        console.log(`✅ Embedded Redis Server active on ${host}:${port}`);
        redisClient = embeddedClient;
        return redisClient;
      } catch (memErr) {
        console.warn('⚠️ Embedded Redis fallback notice, using fallback connection:', memErr);
        const fallbackClient = new Redis({
          host: config.redis.host,
          port: config.redis.port,
          maxRetriesPerRequest: null,
          retryStrategy: () => 1000,
        });
        fallbackClient.on('error', () => {});
        redisClient = fallbackClient;
        return redisClient;
      }
    }
  })();

  return initPromise;
}

// Fallback proxy client for immediate export
export const redisClientProxy = new Proxy({} as Redis, {
  get(target, prop, receiver) {
    if (!redisClient) {
      const fallbackClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null,
        retryStrategy: () => null,
      });
      fallbackClient.on('error', () => {});
      redisClient = fallbackClient;
    }
    const val = (redisClient as any)[prop];
    return typeof val === 'function' ? val.bind(redisClient) : val;
  }
});

export { redisClientProxy as redisClient };

