export const POINTER_MOVE_THRESHOLD_PX = 4;

export const hasPointerMoved = (
  from: { x: number; y: number } | null,
  to: { x: number; y: number },
): boolean => {
  if (from === null) return false;
  return Math.hypot(to.x - from.x, to.y - from.y) > POINTER_MOVE_THRESHOLD_PX;
};
