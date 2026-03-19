
export const enrich = (
  payload: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> => {

  const enriched = { ...payload };

 
  enriched._metadata = {
    processed_at: new Date().toISOString(),
    version: '1.0',
  };

  
  if (config.source_name) {
    enriched._source = config.source_name;
  }

  
  if (config.add_hash) {
    const crypto = require('crypto');
    enriched._hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  
  if (config.static_fields && typeof config.static_fields === 'object') {
    const staticFields = config.static_fields as Record<string, unknown>;
    Object.assign(enriched, staticFields);
  }

  return enriched;
};
