import z from 'zod';
import { sessionStepTable } from './schema';

export type SessionStep = z.infer<typeof sessionStepTable.zodSchema>;
export type CreateSessionStepInput = z.infer<typeof sessionStepTable.createSchema>;
export type UpdateSessionStepInput = z.infer<typeof sessionStepTable.updateSchema>;
