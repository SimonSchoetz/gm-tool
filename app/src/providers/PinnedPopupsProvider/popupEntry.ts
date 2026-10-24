import type {
  PopupMode,
  PopupPlacement,
  PopupPosition,
} from '@/components/MentionPopup';

export type PopupEntry = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  anchor: PopupPosition;
  placement: PopupPlacement;
  zIndex: number;
  mode: PopupMode;
  onMouseEnterBridge: (() => void) | null;
  onMouseLeaveBridge: (() => void) | null;
};
