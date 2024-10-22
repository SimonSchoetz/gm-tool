import { defineSchema } from 'convex/server';
import { sessionsTable, usersTable } from './tables';
import { DbTable } from '@/enums';

export default defineSchema({
  [DbTable.USERS]: usersTable,
  [DbTable.SESSIONS]: sessionsTable,
});
