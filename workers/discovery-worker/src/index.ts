import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { processDiscoveryJob } from './processor';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker('discovery-queue', processDiscoveryJob, {
    connection,
    concurrency: 3,
  });

  worker.on('ready', () => {
    console.log('🔍 [discovery-worker] Online and listening for discovery jobs on discovery-queue');
  });

  worker.on('failed', (job, err) => {
    console.error(`[discovery-worker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[discovery-worker] Worker error:', err);
  });
}

main().catch(console.error);
