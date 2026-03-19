import { transform } from './transform';
import { filter } from './filter';
import { enrich } from './enrich';
import { ActionType } from '../types';

export const processAction = (
  actionType: ActionType,
  payload: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> => {
  switch (actionType) {
    case 'transform':
      return transform(payload, config);
    case 'filter':
      return filter(payload, config);
    case 'enrich':
      return enrich(payload, config);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};
