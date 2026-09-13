import z from 'zod';
import { sessionStepTable } from './schema';
import type { LazyDmStepKey } from '@domain';

export type SessionStep = z.infer<typeof sessionStepTable.zodSchema>;
export type CreateSessionStepInput = {
  session_id: string;
  sort_order: number;
  default_step_key?: LazyDmStepKey | null;
  name?: string;
};
export type UpdateSessionStepInput = z.infer<
  typeof sessionStepTable.updateSchema
>;
