import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyWebsocket);

  const subscriber = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: false,
  });

  subscriber.connect().catch(() => {
    logger.warn('Redis Subscriber deferred connection');
  });

  // Keep track of connected clients by test ID
  const activeRooms = new Map<string, Set<any>>();

  subscriber.on('message', (channel: string, message: string) => {
    // Channel format: loadtest:metrics:<id> or loadtest:status:<id>
    const match = channel.match(/^loadtest:(metrics|status):(.+)$/);
    if (match) {
      const [, type, loadTestId] = match;
      const room = activeRooms.get(loadTestId);
      if (room && room.size > 0) {
        const payload = JSON.stringify({
          type: type === 'metrics' ? 'METRIC' : 'STATUS_CHANGE',
          data: JSON.parse(message),
        });
        for (const client of room) {
          if (client.readyState === 1) { // OPEN
            client.send(payload);
          }
        }
      }
    }
  });

  fastify.get('/ws/load-tests/:id', { websocket: true }, (connection, req) => {
    const { id } = req.params as { id: string };
    const socket = connection;

    if (!activeRooms.has(id)) {
      activeRooms.set(id, new Set());
      subscriber.subscribe(`loadtest:metrics:${id}`, `loadtest:status:${id}`).catch(() => {});
    }

    activeRooms.get(id)!.add(socket);
    logger.info(`WebSocket client connected for test ${id}`, { loadTestId: id });

    socket.on('close', () => {
      const room = activeRooms.get(id);
      if (room) {
        room.delete(socket);
        if (room.size === 0) {
          activeRooms.delete(id);
          subscriber.unsubscribe(`loadtest:metrics:${id}`, `loadtest:status:${id}`).catch(() => {});
        }
      }
      logger.info(`WebSocket client disconnected for test ${id}`, { loadTestId: id });
    });
  });
};

export default fp(websocketPlugin);
