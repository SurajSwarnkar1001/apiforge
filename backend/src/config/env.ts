import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  DATABASE_URL: z.string().default('mongodb://localhost:27017/apiforge_db?directConnection=true'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-change-in-production-min-32-chars-length'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  ALLOW_LOCAL_TARGETS: z.enum(['true', 'false']).transform((val) => val === 'true').default('false'),
  MAX_CONCURRENT_LOAD_TESTS: z.coerce.number().default(5),
  MAX_TEST_DURATION_SECONDS: z.coerce.number().default(1800),
  MAX_VUS_UNVERIFIED: z.coerce.number().default(10),
  MAX_VUS_VERIFIED: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);
