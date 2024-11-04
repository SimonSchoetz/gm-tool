import { zCreateSessionDto } from '@/api/db/validators';
import {
  signature,
  verifySignature,
  zInternalMutation,
  zMutation,
} from '../helper';
import { z } from 'zod';
import { DbTable, HttpStatusCode } from '@/enums';
import { zid } from 'convex-helpers/server/zod';

export const createSession = zMutation({
  args: { ...zCreateSessionDto.shape, signature },
  output: z.object({
    status: z.number(),
    id: zid(DbTable.SESSIONS),
  }),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);
    return await createSessionIntern(ctx, args);
  },
});

export const createSessionIntern = zInternalMutation({
  args: zCreateSessionDto.shape,
  output: z.object({
    status: z.number(),
    id: zid(DbTable.SESSIONS),
  }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert(DbTable.SESSIONS, args);
    return { status: HttpStatusCode.CREATED, id };
  },
});
