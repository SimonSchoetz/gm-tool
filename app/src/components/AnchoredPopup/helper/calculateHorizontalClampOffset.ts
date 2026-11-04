import { EDGE_PADDING } from './AnchoredPopup.constants';

type CalculateHorizontalClampOffsetParams = {
  anchorCenterX: number;
  popupWidth: number;
  viewportWidth: number;
};

export const calculateHorizontalClampOffset = ({
  anchorCenterX,
  popupWidth,
  viewportWidth,
}: CalculateHorizontalClampOffsetParams): number => {
  const halfWidth = popupWidth / 2;

  if (anchorCenterX - halfWidth < EDGE_PADDING) {
    return EDGE_PADDING - (anchorCenterX - halfWidth);
  }
  if (anchorCenterX + halfWidth > viewportWidth - EDGE_PADDING) {
    return viewportWidth - EDGE_PADDING - (anchorCenterX + halfWidth);
  }
  return 0;
};
