import { describe, expect, it } from 'vitest';
import { buildFrameStyles } from '../buildFrameStyles';

describe('buildFrameStyles', () => {
  const frame = { x: 25, y: 75, zoom: 2 };

  it('sets the frame position and zoom for a framed image', () => {
    expect(buildFrameStyles(frame, false)).toEqual({
      '--rt-holo-img-frame-x': '25%',
      '--rt-holo-img-frame-y': '75%',
      '--rt-holo-img-frame-zoom': 2,
    });
  });

  it('sets nothing for the full image', () => {
    expect(buildFrameStyles(frame, true)).toEqual({});
  });

  it('sets nothing for an image without a frame', () => {
    expect(buildFrameStyles(null, false)).toEqual({});
  });
});
