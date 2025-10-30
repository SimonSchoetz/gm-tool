import { getDatabase } from '../database';
import type {
  Adventure,
  PaginationParams,
  PaginatedResponse,
} from './types';

const DEFAULT_LIMIT = 10;

export const getAll = async (
  params?: PaginationParams
): Promise<PaginatedResponse<Adventure>> => {
  const limit = params?.limit ?? DEFAULT_LIMIT;
  const offset = params?.offset ?? 0;

  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  if (offset < 0) {
    throw new Error('Offset must be non-negative');
  }

  const db = await getDatabase();

  const countResult = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM adventures'
  );
  const total = countResult[0].count;

  const data = await db.select<Adventure[]>(
    'SELECT * FROM adventures ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
};
