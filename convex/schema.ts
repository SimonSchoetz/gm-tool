import { defineSchema } from 'convex/server';
import { usersTable } from './tables';
import { DbTable } from '@/enums';

export default defineSchema({
  [DbTable.USERS]: usersTable,
});
