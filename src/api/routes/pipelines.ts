import { Router, Request, Response } from 'express';
import { query } from '../../db';
import { z } from 'zod';

const router = Router();

const CreatePipelineSchema = z.object({
  name: z.string().min(1),
  action_type: z.enum(['transform', 'filter', 'enrich']),
  action_config: z.record(z.string(), z.unknown()).optional().default({}),
  subscribers: z.array(z.url()).min(1),
});


router.get('/', async (req: Request, res: Response) => {
  const result = await query('SELECT * FROM pipelines ORDER BY created_at DESC');
  res.json(result.rows);
});


router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const pipeline = await query('SELECT * FROM pipelines WHERE id = $1', [id]);
  if (pipeline.rows.length === 0) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }
  const subscribers = await query(
    'SELECT * FROM subscribers WHERE pipeline_id = $1',
    [id]
  );
  res.json({ ...pipeline.rows[0], subscribers: subscribers.rows });
});


router.post('/', async (req: Request, res: Response) => {
  const parsed = CreatePipelineSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { name, action_type, action_config, subscribers } = parsed.data;

  const pipeline = await query(
    `INSERT INTO pipelines (name, action_type, action_config)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, action_type, JSON.stringify(action_config)]
  );

  const pipelineId = pipeline.rows[0].id;

  for (const url of subscribers) {
    await query(
      'INSERT INTO subscribers (pipeline_id, url) VALUES ($1, $2)',
      [pipelineId, url]
    );
  }

  const subs = await query(
    'SELECT * FROM subscribers WHERE pipeline_id = $1',
    [pipelineId]
  );

  res.status(201).json({ ...pipeline.rows[0], subscribers: subs.rows });
});


router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, status } = req.body;

  const result = await query(
    `UPDATE pipelines SET
      name = COALESCE($1, name),
      status = COALESCE($2, status),
      updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [name, status, id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await query(
    'DELETE FROM pipelines WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Pipeline not found' });
    return;
  }
  res.json({ message: 'Pipeline deleted successfully' });
});

export default router;
