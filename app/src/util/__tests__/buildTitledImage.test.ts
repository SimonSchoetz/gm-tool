import { describe, expect, it } from 'vitest';
import { buildTitledImage } from '../buildTitledImage';

describe('buildTitledImage', () => {
  it('returns no image when there is no image id', () => {
    expect(buildTitledImage(null, 'Strahd')).toBeNull();
  });

  it('titles the image with the name', () => {
    expect(buildTitledImage('image-1', 'Strahd')).toEqual({
      id: 'image-1',
      title: 'Strahd',
    });
  });

  it('titles the image with an empty string when the name is missing', () => {
    expect(buildTitledImage('image-1', null)).toEqual({
      id: 'image-1',
      title: '',
    });
  });
});
