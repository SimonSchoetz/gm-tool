import { DbTable, HttpStatusCode } from '@/enums';

import { getUserByEmailIntern } from './get_users';
import {
  signature,
  verifySignature,
  zInternalMutation,
  zInternalQuery,
  zMutation,
} from '../helper';
import { z } from 'zod';
import { zCreateUserDto } from '@/api/db/validators';
import { ConvexError } from 'convex/values';
import { zid } from 'convex-helpers/server/zod';

export const createUser = zMutation({
  args: { ...zCreateUserDto.shape, signature },
  output: z.object({
    status: z.number(),
    id: zid(DbTable.USERS),
  }),
  handler: async (ctx, args) => {
    await verifySignature(args.signature);

    return await createUserIntern(ctx, args);
  },
});

export const createUserIntern = zInternalMutation({
  args: zCreateUserDto.shape,
  output: z.object({
    status: z.number(),
    id: zid(DbTable.USERS),
  }),
  handler: async (ctx, args) => {
    if (await emailAlreadyInUse(ctx, { email: args.email })) {
      throw new ConvexError('Email already in use.');
    }
    const id = await ctx.db.insert(DbTable.USERS, args);

    return { status: HttpStatusCode.CREATED, id };
  },
});

const emailAlreadyInUse = zInternalQuery({
  args: { email: zCreateUserDto.shape.email },
  output: z.boolean(),
  handler: async (ctx, args) => {
    const existing = await getUserByEmailIntern(ctx, args);
    return !!existing;
  },
});
