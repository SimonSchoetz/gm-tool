import { invoke } from '@tauri-apps/api/core';
import { getDatabase } from '../database';
import { get } from './get';

export const remove = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Image ID is required');
  }

  // Get the image record to find the file extension
  const image = await get(id);

  // Delete from database
  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);

  // Delete the actual file if the image existed
  if (image) {
    await invoke('delete_image', {
      id,
      extension: image.file_extension,
    });
  }
};
