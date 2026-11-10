// The image overflows the frame by `overflow` px along one axis; at 50% the overflow splits evenly on both sides, so the offset is half of it minus the share the frame position moves past.
export const getBgImageOffset = (
  isImageLoaded: boolean,
  overflow: number,
  framePercent: number,
): number =>
  isImageLoaded ? overflow / 2 - (framePercent / 100) * overflow : 0;
