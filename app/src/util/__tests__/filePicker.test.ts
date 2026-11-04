import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IMAGE_FILE_EXTENSIONS } from '@domain';
import type * as platform from '@platform';
import { filePicker } from '../filePicker';

const pickFile = vi.hoisted(() => vi.fn<typeof platform.pickFile>());

vi.mock('@platform', () => ({ pickFile }));

describe('filePicker', () => {
  beforeEach(() => {
    pickFile.mockReset();
  });

  it('asks the platform for the image extensions and resolves the picked path', async () => {
    pickFile.mockResolvedValue('/path/to/image.jpg');

    await expect(filePicker()).resolves.toBe('/path/to/image.jpg');

    expect(pickFile).toHaveBeenCalledWith({
      extensions: IMAGE_FILE_EXTENSIONS,
    });
  });

  it('resolves null when the pick is cancelled', async () => {
    pickFile.mockResolvedValue(null);

    await expect(filePicker()).resolves.toBeNull();
  });

  it("rejects with an Error's own message, a thrown string as the message, and a formatted message for any other value", async () => {
    // Anchored: toThrow(string) matches a substring, which the fallback branch's "Failed to open file picker: …" message would also contain.
    pickFile.mockRejectedValueOnce(new Error('Dialog failed'));
    await expect(filePicker()).rejects.toThrow(/^Dialog failed$/);

    pickFile.mockRejectedValueOnce('Permission denied');
    await expect(filePicker()).rejects.toThrow(/^Permission denied$/);

    pickFile.mockRejectedValueOnce(404);
    await expect(filePicker()).rejects.toThrow(
      /^Failed to open file picker: 404$/,
    );
  });
});
