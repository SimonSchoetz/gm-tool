import {
  signature,
  verifySignature,
  zInternalMutation,
  zMutation,
} from '../helper';
import { zUserDto } from '@/api/db/validators';
import { zid } from 'convex-helpers/server/zod';
import { DbTable, HttpStatusCode } from '@/enums';
import { getUserByIdIntern } from './get_users';
import { z } from 'zod';

export const updateUser = zMutation({
  args: {
    userId: zid(DbTable.USERS),
    userData: zUserDto.partial(),
    signature,
  },
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);

    return await updateUserIntern(ctx, args);
  },
});

export const updateUserIntern = zInternalMutation({
  args: { userId: zid(DbTable.USERS), userData: zUserDto.partial() },
  output: z.object({
    status: z.number(),
  }),

  handler: async (ctx, args) => {
    const { userId, userData } = args;

    const existingUser = await getUserByIdIntern(ctx, { userId });

    if (!existingUser) {
      return { status: HttpStatusCode.NOT_FOUND };
    }

    await ctx.db.patch(userId, userData);

    return { status: HttpStatusCode.OK };
  },
});
