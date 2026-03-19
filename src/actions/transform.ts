
export const transform = (
  payload: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> => {
  
  
  if (config.pick && Array.isArray(config.pick)) {
    const result: Record<string, unknown> = {};
    for (const key of config.pick) {
      if (typeof key === 'string' && key in payload) {
        result[key] = payload[key];
      }
    }
    return result;
  }

  
  if (config.rename && typeof config.rename === 'object') {
    const rename = config.rename as Record<string, string>;
    const result = { ...payload };
    for (const [oldKey, newKey] of Object.entries(rename)) {
      if (oldKey in result) {
        result[newKey] = result[oldKey];
        delete result[oldKey];
      }
    }
    return result;
  }

  return payload;
};
