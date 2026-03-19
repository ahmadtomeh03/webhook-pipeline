import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import { query } from '../db';
import { processAction } from '../actions';
import { deliverToSubscribers } from '../delivery';
import { ActionType } from '../types';
import { parseRedisUrl } from '../utils/redis';

const connection = parseRedisUrl(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const worker = new Worker(
  'webhook-jobs',
  async (job) => {
    const { jobId, pipelineId, payload } = job.data;

    console.log(`Processing job ${jobId}`);

    await query(
      `UPDATE jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [jobId]
    );

    const pipelineResult = await query(
      'SELECT * FROM pipelines WHERE id = $1',
      [pipelineId]
    );

    const pipeline = pipelineResult.rows[0];

    const result = processAction(
      pipeline.action_type as ActionType,
      payload,
      pipeline.action_config
    );

    await deliverToSubscribers(jobId, pipelineId, result);

    await query(
      `UPDATE jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(result), jobId]
    );

    console.log(`Job ${jobId} completed`);
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  console.error(`Job failed: ${err.message}`);
  if (job) {
    await query(
      `UPDATE jobs SET status = 'failed', error = $1, updated_at = NOW() WHERE id = $2`,
      [err.message, job.data.jobId]
    );
  }
});

console.log('Worker started, waiting for jobs...');
