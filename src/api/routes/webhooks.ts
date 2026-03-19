import { Router, Request, Response } from 'express';
import { query } from '../../db';
import { webhookQueue } from '../../queue';

const router = Router();


router.post('/:sourceId', async (req: Request, res: Response) => {
  const { sourceId } = req.params;

  
  const pipelineResult = await query(
    `SELECT * FROM pipelines WHERE source_id = $1 AND status = 'active'`,
    [sourceId]
  );

  if (pipelineResult.rows.length === 0) {
    res.status(404).json({ error: 'Pipeline not found or inactive' });
    return;
  }

  const pipeline = pipelineResult.rows[0];

  
  const jobResult = await query(
    `INSERT INTO jobs (pipeline_id, status, payload)
     VALUES ($1, 'pending', $2) RETURNING *`,
    [pipeline.id, JSON.stringify(req.body)]
  );

  const job = jobResult.rows[0];

  
  await webhookQueue.add('process-webhook', {
    jobId: job.id,
    pipelineId: pipeline.id,
    payload: req.body,
  });

  
  res.status(202).json({
    message: 'Webhook received and queued',
    job_id: job.id,
  });
});

export default router;
