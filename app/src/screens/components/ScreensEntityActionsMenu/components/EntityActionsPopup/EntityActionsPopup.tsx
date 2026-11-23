import { useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { EntityType } from '@domain';
import { PopupSurface } from '@/components/PopupSurface/PopupSurface';
import { FCProps } from '@/types/fcProps.type';
import { ScreensEntityActions } from '../../../ScreensEntityActions';
import { usePopupDismiss } from '../../hooks/usePopupDismiss';
import './EntityActionsPopup.css';

type Props = {
  entityType: EntityType;
  entityId: string;
  adventureId: string;
  anchor: { top: number; right: number };
  gearRef: RefObject<HTMLElement | null>;
  onClose: () => void;
};

// Portalled because every screen header sits inside a `GlassPanel`, which clips its overflow; positioned from the gear's rect: its right edge on the gear's, its top at the gear's bottom, so the gear stays visible and clickable.
export const EntityActionsPopup: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
  anchor,
  gearRef,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  usePopupDismiss({ popupRef, ignoreRef: gearRef, onDismiss: onClose });

  const style = {
    '--rt-entity-actions-popup-top': `${anchor.top}px`,
    '--rt-entity-actions-popup-right': `${anchor.right}px`,
  } as React.CSSProperties;

  return createPortal(
    <div ref={popupRef} className='entity-actions-popup' style={style}>
      <PopupSurface>
        <ul className='entity-actions-popup--rows'>
          <ScreensEntityActions
            entityType={entityType}
            entityId={entityId}
            adventureId={adventureId}
            afterDelete='go-to-list'
            onChoose={onClose}
          />
        </ul>
      </PopupSurface>
    </div>,
    document.body,
  );
};
