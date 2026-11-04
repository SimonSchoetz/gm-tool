import { EDGE_PADDING } from './AnchoredPopup.constants';

type CalculateVerticalPlacementParams = {
  anchorTop: number;
  popupHeight: number;
};

export const calculateVerticalPlacement = ({
  anchorTop,
  popupHeight,
}: CalculateVerticalPlacementParams): 'above' | 'below' =>
  anchorTop - popupHeight < EDGE_PADDING ? 'below' : 'above';
