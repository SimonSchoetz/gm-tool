import {
  signature,
  verifySignature,
  zInternalMutation,
  zMutation,
} from '../helper';
import { z } from 'zod';
import { DbTable, HttpStatusCode } from '@/enums';
import { zid } from 'convex-helpers/server/zod';

export const deleteSession = zMutation({
  args: { sessionId: zid(DbTable.SESSIONS), signature },
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);
    return await deleteSessionIntern(ctx, args);
  },
});

export const deleteSessionIntern = zInternalMutation({
  args: { sessionId: zid(DbTable.SESSIONS) },
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
    return { status: HttpStatusCode.ACCEPTED };
  },
});
