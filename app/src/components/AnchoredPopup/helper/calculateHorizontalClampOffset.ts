type CalculateHorizontalClampOffsetParams = {
  anchorCenterX: number;
  popupWidth: number;
  viewportWidth: number;
  edgePadding: number;
};

export const calculateHorizontalClampOffset = ({
  anchorCenterX,
  popupWidth,
  viewportWidth,
  edgePadding,
}: CalculateHorizontalClampOffsetParams): number => {
  const halfWidth = popupWidth / 2;

  if (anchorCenterX - halfWidth < edgePadding) {
    return edgePadding - (anchorCenterX - halfWidth);
  }
  if (anchorCenterX + halfWidth > viewportWidth - edgePadding) {
    return viewportWidth - edgePadding - (anchorCenterX + halfWidth);
  }
  return 0;
};
