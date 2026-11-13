import { invoke } from '@platform';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import { get } from './get';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'image');

  const image = await get(id);

  // The file goes first: when deleting it fails, the row stays and still names the file, so a later remove of the same id can retry both.
  if (image) {
    await invoke('delete_image', {
      id,
      extension: image.file_extension,
    });
  }

  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);
};
