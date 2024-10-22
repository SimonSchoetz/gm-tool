import { zCreateSessionDto } from '@/api/db/validators';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineTable } from 'convex/server';

export const sessionsTable = defineTable(zodToConvex(zCreateSessionDto))
  .index('by_userId', ['userId'])
  .index('by_refreshToken', ['refreshToken']);
