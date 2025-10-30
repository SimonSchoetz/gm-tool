import z from 'zod';
import { adventureTable } from './schema';

export type Adventure = z.infer<typeof adventureTable.zodSchema>;
export type CreateAdventureInput = z.infer<typeof adventureTable.createSchema>;
export type UpdateAdventureInput = z.infer<typeof adventureTable.updateSchema>;

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
