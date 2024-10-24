import { zInternalMutation } from '../helper';
import { z } from 'zod';
import { DbTable } from '@/enums';
import { deleteSession } from '../sessions';

export const cleanupSessions = zInternalMutation({
  args: {},
  output: z.object({ status: z.number() }),
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const expiredSessions = await ctx.db
      .query(DbTable.SESSIONS)
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .collect();

    for (const session of expiredSessions) {
      await deleteSession(ctx, { sessionId: session._id });
    }

    return { status: 200 };
  },
});
