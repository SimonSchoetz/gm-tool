import { ANIMATION_DURATION } from '../NewItemBtn.constants';

export const getActionDelay = (suppressAnimation?: boolean): number =>
  suppressAnimation ? 0 : ANIMATION_DURATION;
