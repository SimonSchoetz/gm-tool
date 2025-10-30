import z from 'zod';
import { sessionTable } from './schema';

export type Session = z.infer<typeof sessionTable.zodSchema>;
export type CreateSessionInput = z.infer<typeof sessionTable.createSchema>;
export type UpdateSessionInput = z.infer<typeof sessionTable.updateSchema>;

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
