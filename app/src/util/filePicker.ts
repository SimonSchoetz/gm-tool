import { IMAGE_FILE_EXTENSIONS } from '@domain';
import { pickFile } from '@platform';

const fileTypes = {
  image: IMAGE_FILE_EXTENSIONS,
  document: ['pdf', 'md'],
} as const satisfies Record<string, readonly string[]>;

export const filePicker = async (fileType: keyof typeof fileTypes) => {
  try {
    const selected = await pickFile({ extensions: fileTypes[fileType] });

    return selected;
  } catch (err) {
    let errorMsg: string;

    if (err instanceof Error) {
      errorMsg = err.message;
    } else if (typeof err === 'string') {
      errorMsg = err;
    } else {
      errorMsg = `Failed to open file picker: ${String(err)}`;
    }

    throw new Error(errorMsg, { cause: err });
  }
};
