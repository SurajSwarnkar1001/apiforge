import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { processLoadTestJob } from './processor';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker(
    'loadtest-queue',
    async (job) => {
      return processLoadTestJob(job, connection);
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('ready', () => {
    console.log('⚡ [loadtest-worker] Online and ready to execute distributed k6 load testing scenarios');
  });

  worker.on('failed', (job, err) => {
    console.error(`[loadtest-worker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[loadtest-worker] Worker error:', err);
  });
}

main().catch(console.error);
