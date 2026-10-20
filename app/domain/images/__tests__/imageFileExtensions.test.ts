import { describe, expect, it } from 'vitest';
import {
  IMAGE_FILE_EXTENSIONS,
  isImageFileExtension,
} from '../imageFileExtensions';

describe('isImageFileExtension', () => {
  it.each(IMAGE_FILE_EXTENSIONS)('accepts %s', (extension) => {
    expect(isImageFileExtension(extension)).toBe(true);
  });

  it.each(['svg', 'png.exe', ''])('rejects %s', (value) => {
    expect(isImageFileExtension(value)).toBe(false);
  });
});
