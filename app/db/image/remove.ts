import { invoke } from '@tauri-apps/api/core';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import { get } from './get';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'image');

  const image = await get(id);

  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);

  if (image) {
    await invoke('delete_image', {
      id,
      extension: image.file_extension,
    });
  }
};
