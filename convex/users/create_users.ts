import { DbTable, HttpStatusCode } from '@/enums';

import { getUserByEmail } from './get_users';
import { zInternalMutation, zMutation } from '../helper';
import { z } from 'zod';
import { zUserDto } from '@/api/validators';
import { ConvexError } from 'convex/values';

const createUserArgs = zUserDto.pick({
  userName: true,
  email: true,
  passwordHash: true,
  emailVerified: true,
});

export type CreateUserDTO = z.infer<typeof createUserArgs>;

export const createUser = zMutation({
  args: createUserArgs.shape,
  output: z.object({
    status: z.number(),
  }),
  handler: async (ctx, args: CreateUserDTO) => {
    if (await emailAlreadyInUse(ctx, args)) {
      throw new ConvexError('Email already in use.');
    }
    // ctx.auth.getUserIdentity()
    await ctx.db.insert(DbTable.USERS, args);

    return { status: HttpStatusCode.CREATED };
  },
});

const emailAlreadyInUse = zInternalMutation({
  args: { email: createUserArgs.shape.email },
  output: z.boolean(),
  handler: async (ctx, args) => {
    const existing = await getUserByEmail(ctx, args);
    return !!existing;
  },
});
