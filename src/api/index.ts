import express from 'express';
import pipelinesRouter from './routes/pipelines';
import jobsRouter from './routes/jobs';
import webhooksRouter from './routes/webhooks';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/pipelines', pipelinesRouter);
app.use('/jobs', jobsRouter);
app.use('/webhooks', webhooksRouter);

export default app;
