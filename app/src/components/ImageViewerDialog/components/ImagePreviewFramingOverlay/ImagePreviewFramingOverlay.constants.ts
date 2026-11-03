import type { FrameState } from './helper/clampFrame';

export const IPFO_FRAME_BORDER_WIDTH = 2;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.001;
// The values `ImageById.css` falls back to for an image with no stored frame.
export const DEFAULT_FRAME: FrameState = { x: 50, y: 0, zoom: 1 };
