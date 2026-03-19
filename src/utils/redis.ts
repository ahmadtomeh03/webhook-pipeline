export const parseRedisUrl = (url: string): { host: string; port: number } => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
  };
};
