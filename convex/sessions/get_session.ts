import { zid } from 'convex-helpers/server/zod';
import { signature, verifySignature, zInternalQuery, zQuery } from '../helper';
import { DbTable } from '@/enums';
import { zDbSessionData } from '@/api/db/validators';
import { getOneFrom } from 'convex-helpers/server/relationships';

export const getSessionByUserId = zQuery({
  args: { sessionToken: zDbSessionData.shape.sessionToken, signature },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);
    return await getSessionByUserIdIntern(ctx, args);
  },
});

export const getSessionByUserIdIntern = zInternalQuery({
  args: { sessionToken: zDbSessionData.shape.sessionToken },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    return await getOneFrom(
      ctx.db,
      DbTable.SESSIONS,
      'by_userId',
      args.sessionToken,
      'userId'
    );
  },
});

export const getSessionById = zQuery({
  args: { sessionId: zid(DbTable.SESSIONS), signature },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);
    return await getSessionByIdIntern(ctx, args);
  },
});

export const getSessionByIdIntern = zInternalQuery({
  args: { sessionId: zid(DbTable.SESSIONS) },
  output: zDbSessionData.nullable(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});
