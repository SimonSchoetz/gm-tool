import { tableLayoutSchema } from './layout-schema';
import type { TableLayout } from './layout-schema';

export const parseLayoutFromRow = (layoutJson: string): TableLayout => {
  const parsed = JSON.parse(layoutJson);
  const result = tableLayoutSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Stored layout is invalid: ${result.error.message}`);
  }
  return result.data;
};
