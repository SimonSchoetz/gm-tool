import { initDatabase } from '@db/database';

let initialized = false;

export const ensureInitialized = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  await initDatabase();
  initialized = true;
};
