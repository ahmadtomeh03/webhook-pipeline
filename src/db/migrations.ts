import { query } from './index';

export const runMigrations = async (): Promise<void> => {
  console.log('Running migrations...');

  
  await query(`
    CREATE TABLE IF NOT EXISTS pipelines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      source_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      action_type VARCHAR(50) NOT NULL,
      action_config JSONB NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  
  await query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  
  await query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL DEFAULT '{}',
      result JSONB,
      error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  
  await query(`
    CREATE TABLE IF NOT EXISTS delivery_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
      status_code INTEGER,
      success BOOLEAN NOT NULL DEFAULT false,
      error TEXT,
      attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  console.log(' Migrations completed successfully');
};
