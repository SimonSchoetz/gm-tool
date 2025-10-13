import { getDatabase } from '../database';
import type { Session, PaginationParams, PaginatedResponse } from './types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const getAll = async (
  params: PaginationParams = {}
): Promise<PaginatedResponse<Session>> => {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const offset = params.offset ?? 0;

  if (limit < 1) {
    throw new Error('Limit must be at least 1');
  }

  if (offset < 0) {
    throw new Error('Offset cannot be negative');
  }

  const enforcedLimit = Math.min(limit, MAX_LIMIT);

  const db = await getDatabase();

  const totalSessionsCount = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM sessions'
  );
  const totalSessions = totalSessionsCount[0].count;

  const paginatedSessions = await db.select<Session[]>(
    'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [enforcedLimit, offset]
  );

  const hasMoreSessions = offset + paginatedSessions.length < totalSessions;

  return {
    data: paginatedSessions,
    total: totalSessions,
    limit: enforcedLimit,
    offset,
    hasMore: hasMoreSessions,
  };
};
