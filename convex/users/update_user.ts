import { zMutation } from '../helper';
import { zUserDto } from '@/api/db/validators';
import { zid } from 'convex-helpers/server/zod';
import { DbTable, HttpStatusCode } from '@/enums';
import { getUserById } from './get_users';
import { z } from 'zod';

export const updateUser = zMutation({
  args: {
    userId: zid(DbTable.USERS),
    userData: zUserDto.partial(),
  },
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args) => {
    const { userId, userData } = args;

    const existingUser = await getUserById(ctx, { userId });

    if (!existingUser) {
      return { status: HttpStatusCode.NOT_FOUND };
    }

    await ctx.db.patch(userId, userData);

    return { status: HttpStatusCode.OK };
  },
});
