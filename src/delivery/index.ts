import axios from 'axios';
import { query } from '../db';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const deliverToSubscribers = async (
  jobId: string,
  pipelineId: string,
  result: Record<string, unknown>
): Promise<void> => {
  const subscribers = await query(
    'SELECT * FROM subscribers WHERE pipeline_id = $1',
    [pipelineId]
  );

  for (const subscriber of subscribers.rows) {
    let success = false;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let statusCode: number | null = null;
      let error: string | null = null;

      try {
        const response = await axios.post(subscriber.url, result, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
        statusCode = response.status;
        success = response.status >= 200 && response.status < 300;
      } catch (err: unknown) {
        statusCode = axios.isAxiosError(err) ? err.response?.status || null : null;
        error = axios.isAxiosError(err) ? err.message : 'Unknown error';
      }

      await query(
        `INSERT INTO delivery_attempts 
          (job_id, subscriber_id, status_code, success, error)
         VALUES ($1, $2, $3, $4, $5)`,
        [jobId, subscriber.id, statusCode, success, error]
      );

      if (success) {
        console.log(`Delivered to ${subscriber.url} on attempt ${attempt + 1}`);
        break;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await sleep(delay);
      } else {
        console.log(`All ${MAX_RETRIES} attempts failed for ${subscriber.url}`);
      }
    }
  }
};
