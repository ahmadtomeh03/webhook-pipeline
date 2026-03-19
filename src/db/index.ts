import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

console.log('Connecting to:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query executed', { text, duration: `${duration}ms`, rows: res.rowCount });
  return res;
};

export default pool;
