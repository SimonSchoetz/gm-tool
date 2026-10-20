import { describe, expect, it } from 'vitest';
import { isImageFileExtension } from '../imageFileExtensions';

describe('isImageFileExtension', () => {
  it('accepts a member of IMAGE_FILE_EXTENSIONS and rejects an extension outside it', () => {
    expect(isImageFileExtension('png')).toBe(true);
    expect(isImageFileExtension('svg')).toBe(false);
  });
});
