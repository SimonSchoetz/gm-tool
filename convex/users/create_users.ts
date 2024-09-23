import { DbTable, HttpStatusCode } from '@/enums';

import { getUserByEmail } from './get_users';
import { zInternalMutation, zMutation } from '../helper';
import { z } from 'zod';
import { zCreateUserDto } from '@/api/db/validators';
import { ConvexError } from 'convex/values';
import { CreateUserDto } from '@/types/api/db';

export const createUser = zMutation({
  args: zCreateUserDto.shape,
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args: CreateUserDto) => {
    if (await emailAlreadyInUse(ctx, args)) {
      throw new ConvexError('Email already in use.');
    }
    // ctx.auth.getUserIdentity()
    await ctx.db.insert(DbTable.USERS, args);

    return { status: HttpStatusCode.CREATED };
  },
});

const emailAlreadyInUse = zInternalMutation({
  args: { email: zCreateUserDto.shape.email },
  output: z.boolean(),
  handler: async (ctx, args) => {
    const existing = await getUserByEmail(ctx, args);
    return !!existing;
  },
});
