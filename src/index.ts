import dotenv from 'dotenv';
dotenv.config();

import app from './api';
import { runMigrations } from './db/migrations';

const PORT = process.env.PORT || 3000;

const start = async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch(console.error);
