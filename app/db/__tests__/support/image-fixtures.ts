// Each helper resolves `@db/database` when called, after the calling test's `vi.resetModules()`, so it reaches that test's database.
import type { Image } from '@db/image';

const testDatabase = async () => {
  const { getDatabase } = await import('@db/database');
  return getDatabase();
};

export const answerImageCommand = (command: string): Promise<unknown> => {
  switch (command) {
    case 'save_image':
      return Promise.resolve(1234);
    case 'read_image_bytes':
      return Promise.resolve('aW1hZ2U=');
    case 'save_image_bytes':
    case 'delete_image':
      return Promise.resolve(undefined);
    default:
      return Promise.reject(new Error(`Unexpected command: ${command}`));
  }
};

export const seedImage = async (
  id: string,
  fileExtension: string,
  seededAt: string,
): Promise<void> => {
  const db = await testDatabase();
  await db.execute(
    'INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)',
    [id, fileExtension, seededAt],
  );
};

export const readImages = async (): Promise<Image[]> => {
  const db = await testDatabase();
  return db.select<Image[]>('SELECT * FROM images');
};
