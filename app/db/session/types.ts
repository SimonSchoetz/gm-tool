import z from 'zod';
import { sessionTable } from './schema';

export type Session = z.infer<typeof sessionTable.zodSchema>;
export type CreateSessionInput = z.infer<typeof sessionTable.createSchema>;
export type UpdateSessionInput = z.infer<typeof sessionTable.updateSchema>;

