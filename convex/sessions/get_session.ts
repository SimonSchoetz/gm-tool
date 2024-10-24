import { zid } from 'convex-helpers/server/zod';
import { zQuery } from '../helper';
import { DbTable } from '@/enums';
import { zDbSessionData } from '@/api/db/validators';
import { getOneFrom } from 'convex-helpers/server/relationships';

export const getSessionByToken = zQuery({
  args: { sessionToken: zDbSessionData.shape.sessionToken },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    return await getOneFrom(
      ctx.db,
      DbTable.SESSIONS,
      'by_sessionToken',
      args.sessionToken,
      'sessionToken'
    );
  },
});

export const getSessionById = zQuery({
  args: { sessionId: zid(DbTable.SESSIONS) },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});
