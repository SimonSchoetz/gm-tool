import z from 'zod';
import {
  sessionSchema,
  createSessionSchema,
  updateSessionSchema,
} from './schema';

export type Session = z.infer<typeof sessionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

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
