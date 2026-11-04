import { IMAGE_FILE_EXTENSIONS } from '@domain';
import { pickFile } from '@platform';

export const filePicker = async () => {
  try {
    const selected = await pickFile({ extensions: IMAGE_FILE_EXTENSIONS });

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
