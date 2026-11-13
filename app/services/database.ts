import { initDatabase } from '@db/database';
import { cleanUpAbandonedImages } from '@services/imageService';

let initialized = false;

export const ensureInitialized = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  await initDatabase();
  // Before any screen, and so before sync starts: the app's first reads see no image a flow of this device abandoned.
  await cleanUpAbandonedImages();
  initialized = true;
};
