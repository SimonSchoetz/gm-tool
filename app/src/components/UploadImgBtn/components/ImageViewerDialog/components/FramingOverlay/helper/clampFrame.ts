export type FrameState = {
  x: number;
  y: number;
  zoom: number;
};

export const clampFrame = (frame: FrameState, maxZoom: number): FrameState => ({
  x: Math.min(100, Math.max(0, frame.x)),
  y: Math.min(100, Math.max(0, frame.y)),
  zoom: Math.min(maxZoom, Math.max(1, frame.zoom)),
});
