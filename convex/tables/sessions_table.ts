import { zodToConvex } from 'convex-helpers/server/zod';
import { defineTable } from 'convex/server';
import { z } from 'zod';

export const sessionsTable = defineTable(
  zodToConvex(
    z.object({
      refreshToken: z.string().min(1),
      userId: z.string().min(1),
      accessToken: z.string().min(1),
      expiresAt: z.date(),
    })
  )
)
  .index('by_userId', ['userId'])
  .index('by_refreshToken', ['refreshToken']);
