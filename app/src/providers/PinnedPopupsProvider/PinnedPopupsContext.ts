import { createContext } from 'react';
import type {
  PopupPlacement,
  PopupPosition,
} from '../../components/MentionPopup';

export type ShowPopupArgs = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  placement: PopupPlacement;
  onMouseEnterBridge?: () => void;
  onMouseLeaveBridge?: () => void;
};

export type PinnedPopupsContextValue = {
  showPopup: (args: ShowPopupArgs) => void;
  hidePopup: (entityId: string) => void;
  pinPopup: (entityId: string) => void;
  removePopup: (entityId: string) => void;
  hasPopup: (entityId: string) => boolean;
};

export const PinnedPopupsContext =
  createContext<PinnedPopupsContextValue | null>(null);
