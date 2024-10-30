import { zInternalMutation } from '../helper';
import { z } from 'zod';
import { DbTable } from '@/enums';
import { deleteSession } from '../sessions';

export const cleanupSessions = zInternalMutation({
  args: {},
  output: z.object({ status: z.number() }),
  handler: async (ctx) => {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const expiredSessions = await ctx.db
      .query(DbTable.SESSIONS)
      .filter((q) => q.lt(q.field('_creationTime'), oneMonthAgo))
      .collect();

    for (const session of expiredSessions) {
      await deleteSession(ctx, { sessionId: session._id });
    }

    return { status: 200 };
  },
});
