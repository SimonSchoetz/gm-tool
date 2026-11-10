import type { CSSProperties } from 'react';
import type { ImageFrame } from '@/data-access-layer';

export const buildFrameStyles = (
  frame: ImageFrame | null,
  fullImage: boolean,
): CSSProperties =>
  !fullImage && frame !== null
    ? ({
        '--rt-holo-img-frame-x': `${frame.x}%`,
        '--rt-holo-img-frame-y': `${frame.y}%`,
        '--rt-holo-img-frame-zoom': frame.zoom,
      } as CSSProperties)
    : {};
