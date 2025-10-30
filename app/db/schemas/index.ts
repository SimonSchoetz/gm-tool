import { createAdventuresTable } from './adventures.sql';
import { createSessionsTable } from './sessions.sql';

export const tableSchemas = [
  { name: 'adventures', sql: createAdventuresTable },
  { name: 'sessions', sql: createSessionsTable },
];
