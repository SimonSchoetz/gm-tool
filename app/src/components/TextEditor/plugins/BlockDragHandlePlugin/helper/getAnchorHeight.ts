import { getTargetCalculateHeight } from './getTargetCalculateHeight';

export const getAnchorHeight = (
  hoveredElement: HTMLElement | null,
): number | null =>
  hoveredElement ? getTargetCalculateHeight(hoveredElement) : null;
