import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

export const getImageUrl = async (
  id: string,
  extension: string
): Promise<string> => {
  const path = await invoke<string>('get_image_url', {
    id,
    extension,
  });

  return convertFileSrc(path);
};
