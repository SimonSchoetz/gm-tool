import { defineTable } from 'convex/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { zUserDto } from '@/api/validators';

export const usersTable = defineTable(zodToConvex(zUserDto)).index('by_email', [
  'email',
]);
