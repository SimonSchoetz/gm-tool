import { DbTable } from '@/enums';
import { zQuery } from '../helper';
import { zid } from 'convex-helpers/server/zod';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { zDbUserData } from '@/api/validators';

export const getUserByEmail = zQuery({
  args: { email: zDbUserData.shape.email },
  output: zDbUserData.nullable(),
  handler: async (ctx, args) => {
    return await getOneFrom(
      ctx.db,
      DbTable.USERS,
      'by_email',
      args.email,
      'email'
    );
  },
});

export const getUserById = zQuery({
  args: { userId: zid(DbTable.USERS) },
  output: zDbUserData.nullable(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
