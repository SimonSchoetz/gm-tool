import type { Migration } from './index.ts';
import { ensureColumn } from '../util/index.ts';

export const addSessionStepCollapsedMigration: Migration = {
  id: '1794237574685',
  up: async (db) => {
    await ensureColumn(
      db,
      'session_steps',
      'collapsed',
      'ALTER TABLE session_steps ADD COLUMN collapsed INTEGER NOT NULL DEFAULT 0',
    );
  },
};
