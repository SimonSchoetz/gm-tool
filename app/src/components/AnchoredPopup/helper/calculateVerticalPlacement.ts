type CalculateVerticalPlacementParams = {
  anchorTop: number;
  popupHeight: number;
  edgePadding: number;
};

export const calculateVerticalPlacement = ({
  anchorTop,
  popupHeight,
  edgePadding,
}: CalculateVerticalPlacementParams): 'above' | 'below' =>
  anchorTop - popupHeight < edgePadding ? 'below' : 'above';
