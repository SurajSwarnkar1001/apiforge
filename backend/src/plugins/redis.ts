import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    discoveryQueue: Queue;
    loadtestQueue: Queue;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableReadyCheck: false,
  });

  await redis.connect().catch((err) => {
    fastify.log.warn('Redis initial connection deferred: ' + err.message);
  });

  const discoveryQueue = new Queue('discovery-queue', { connection: redis });
  const loadtestQueue = new Queue('loadtest-queue', { connection: redis });

  fastify.decorate('redis', redis);
  fastify.decorate('discoveryQueue', discoveryQueue);
  fastify.decorate('loadtestQueue', loadtestQueue);

  fastify.addHook('onClose', async (server) => {
    await server.discoveryQueue.close();
    await server.loadtestQueue.close();
    server.redis.disconnect();
  });
};

export default fp(redisPlugin);
