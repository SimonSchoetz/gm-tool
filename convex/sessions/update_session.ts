import { zMutation } from '../helper';

import { zid } from 'convex-helpers/server/zod';
import { DbTable, HttpStatusCode } from '@/enums';

import { z } from 'zod';
import { zSessionDto } from '@/api/db/validators';
import { getSessionById } from './get_session';

export const updateSession = zMutation({
  args: {
    sessionId: zid(DbTable.SESSIONS),
    sessionData: zSessionDto.partial(),
  },
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args) => {
    const { sessionId, sessionData } = args;

    const existingSession = await getSessionById(ctx, { sessionId });

    if (!existingSession) {
      return { status: HttpStatusCode.NOT_FOUND };
    }

    await ctx.db.patch(sessionId, sessionData);

    return { status: HttpStatusCode.OK };
  },
});
