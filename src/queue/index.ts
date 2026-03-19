import { Queue } from 'bullmq';
import { parseRedisUrl } from '../utils/redis';

const connection = parseRedisUrl(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const webhookQueue = new Queue('webhook-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export default webhookQueue;
