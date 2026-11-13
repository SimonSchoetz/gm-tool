import { invoke } from '@platform';
import { IMAGE_FILE_EXTENSIONS } from '@domain';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import { get } from './get';

export const remove = async (id: string): Promise<void> => {
  assertValidId(id, 'image');

  const image = await get(id);

  // An id with no row can still have a file: one create or duplicate wrote before its row insert failed or a quit cut it off. Only the row names the extension, so then the file is deleted under every extension an image can have; delete_image succeeds for a file that is not there.
  const extensions = image ? [image.file_extension] : IMAGE_FILE_EXTENSIONS;

  // The files go first: when deleting one fails, this rejects before the row is deleted, so a later remove of the same id can retry both.
  for (const extension of extensions) {
    await invoke('delete_image', { id, extension });
  }

  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);
};
