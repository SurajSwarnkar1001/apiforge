import { buildServer } from './server';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main() {
  const server = await buildServer();

  try {
    const address = await server.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });
    logger.info(`🚀 APIForge Core Backend listening on ${address}`, {
      port: env.PORT,
      env: env.NODE_ENV,
    });
  } catch (err: any) {
    logger.error(`Fatal server crash: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

main();
