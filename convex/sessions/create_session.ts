import { zCreateSessionDto } from '@/api/db/validators';
import { zMutation } from '../helper';
import { z } from 'zod';
import { CreateSessionDto } from '@/types/api/db/session';
import { DbTable, HttpStatusCode } from '@/enums';
import { zid } from 'convex-helpers/server/zod';

export const createSession = zMutation({
  args: zCreateSessionDto.shape,
  output: z.object({
    status: z.number(),
    id: zid(DbTable.SESSIONS),
  }),
  handler: async (ctx, args: CreateSessionDto) => {
    const id = await ctx.db.insert(DbTable.SESSIONS, args);

    return { status: HttpStatusCode.CREATED, id };
  },
});
