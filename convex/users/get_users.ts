import { DbTable } from '@/enums';
import { zQuery, signature, verifySignature, zInternalQuery } from '../helper';
import { zid } from 'convex-helpers/server/zod';
import { getOneFrom } from 'convex-helpers/server/relationships';
import { zDbUserData } from '@/api/db/validators';

export const getUserByEmail = zQuery({
  args: { email: zDbUserData.shape.email, signature },
  output: zDbUserData.nullable(),
  handler: async (ctx, args) => {
    try {
      await verifySignature(args.signature);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return await getUserByEmailIntern(ctx, { email: args.email });
  },
});

export const getUserByEmailIntern = zInternalQuery({
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
  args: { userId: zid(DbTable.USERS), signature },
  output: zDbUserData.nullable(),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);
    return getUserByIdIntern(ctx, { userId: args.userId });
  },
});

export const getUserByIdIntern = zInternalQuery({
  args: { userId: zid(DbTable.USERS) },
  output: zDbUserData.nullable(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
