import { Router, Request, Response } from 'express';
import { query } from '../../db';

const router = Router();


router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const job = await query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (job.rows.length === 0) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const attempts = await query(
    `SELECT da.*, s.url as subscriber_url
     FROM delivery_attempts da
     JOIN subscribers s ON s.id = da.subscriber_id
     WHERE da.job_id = $1
     ORDER BY da.attempted_at DESC`,
    [id]
  );

  res.json({ ...job.rows[0], delivery_attempts: attempts.rows });
});


router.get('/', async (req: Request, res: Response) => {
  const { pipeline_id } = req.query;

  const result = pipeline_id
    ? await query(
        'SELECT * FROM jobs WHERE pipeline_id = $1 ORDER BY created_at DESC',
        [pipeline_id]
      )
    : await query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50');

  res.json(result.rows);
});

export default router;
