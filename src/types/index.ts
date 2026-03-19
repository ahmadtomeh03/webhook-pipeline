export type PipelineStatus = 'active' | 'inactive';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ActionType = 'transform' | 'filter' | 'enrich';

export interface Pipeline {
  id: string;
  name: string;
  source_id: string;      
  action_type: ActionType;
  action_config: Record<string, unknown>;
  status: PipelineStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Subscriber {
  id: string;
  pipeline_id: string;
  url: string;
  created_at: Date;
}

export interface Job {
  id: string;
  pipeline_id: string;
  status: JobStatus;
  payload: Record<string, unknown>;   
  result: Record<string, unknown> | null; 
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryAttempt {
  id: string;
  job_id: string;
  subscriber_id: string;
  status_code: number | null;
  success: boolean;
  error: string | null;
  attempted_at: Date;
}
