import { MAX_ZOOM, MIN_ZOOM } from '../ImagePreviewFramingOverlay.constants';

export type FrameState = {
  x: number;
  y: number;
  zoom: number;
};

export const clampFrame = (frame: FrameState): FrameState => ({
  x: Math.min(100, Math.max(0, frame.x)),
  y: Math.min(100, Math.max(0, frame.y)),
  zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, frame.zoom)),
});
