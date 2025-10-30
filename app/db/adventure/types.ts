import z from 'zod';
import {
  adventureSchema,
  createAdventureSchema,
  updateAdventureSchema,
} from './schema';

export type Adventure = z.infer<typeof adventureSchema>;
export type CreateAdventureInput = z.infer<typeof createAdventureSchema>;
export type UpdateAdventureInput = z.infer<typeof updateAdventureSchema>;

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
