export const filter = (
  payload: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> => {

  const { field, operator, value } = config as {
    field: string;
    operator: string;
    value: unknown;
  };

  if (!field || !operator) return payload;

  const fieldValue = payload[field];

  let passed = false;

  switch (operator) {
    case 'eq':
      passed = fieldValue === value;
      break;
    case 'neq':
      passed = fieldValue !== value;
      break;
    case 'exists':
      passed = field in payload;
      break;
    case 'contains':
      passed = typeof fieldValue === 'string' && fieldValue.includes(String(value));
      break;
    default:
      passed = true;
  }

  if (!passed) {
    throw new Error(`Filter condition not met: ${field} ${operator} ${value}`);
  }

  return payload;
};
