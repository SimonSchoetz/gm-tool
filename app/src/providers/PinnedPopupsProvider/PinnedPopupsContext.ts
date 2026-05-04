import { createContext } from 'react';
import type { PopupPosition, PopupPlacement } from '@/components';

export type PinPopupArgs = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  position: PopupPosition;
  placement: PopupPlacement;
};

export type PinnedPopupsContextValue = {
  pinPopup: (args: PinPopupArgs) => void;
  removePopup: (entityId: string) => void;
  isPinned: (entityId: string) => boolean;
  updatePopupZIndex: (entityId: string, zIndex: number) => void;
  updatePopupPosition: (entityId: string, position: PopupPosition) => void;
};

export const PinnedPopupsContext =
  createContext<PinnedPopupsContextValue | null>(null);
