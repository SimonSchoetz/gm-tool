import { FileTypes } from '@/types';
import { open } from '@tauri-apps/plugin-dialog';

const fileTypes: FileTypes = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  document: ['pdf', 'md'],
};

export const filePicker = async (fileType: keyof FileTypes) => {
  try {
    const extensions = fileTypes[fileType];
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Allowed Files', extensions }],
    });

    return selected;
  } catch (err) {
    let errorMsg = '';

    if (err instanceof Error) {
      errorMsg = err.message;
    } else if (typeof err === 'string') {
      errorMsg = err;
    } else {
      errorMsg = `Failed to open file picker: ${String(err)}`;
    }

    throw new Error(errorMsg);
  }
};
