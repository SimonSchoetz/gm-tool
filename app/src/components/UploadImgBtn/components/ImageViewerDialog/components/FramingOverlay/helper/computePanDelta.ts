export const computePanDelta = (
  dx: number,
  dy: number,
  containerWidth: number,
  containerHeight: number,
  zoom: number,
): { dx: number; dy: number } => ({
  dx: (dx / containerWidth) * 100 / zoom,
  dy: (dy / containerHeight) * 100 / zoom,
});
