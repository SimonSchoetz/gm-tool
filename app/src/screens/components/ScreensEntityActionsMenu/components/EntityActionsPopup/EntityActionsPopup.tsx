import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import type { EntityType } from '@domain';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
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
  onClose: () => void;
};

// Portalled because every screen header sits inside a `GlassPanel`, which clips its overflow; positioned from the gear's rect so the Close control covers the gear.
export const EntityActionsPopup: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
  anchor,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  usePopupDismiss({ popupRef, onDismiss: onClose });

  const style = {
    '--rt-entity-actions-popup-top': `${anchor.top}px`,
    '--rt-entity-actions-popup-right': `${anchor.right}px`,
  } as React.CSSProperties;

  return createPortal(
    <div ref={popupRef} className='entity-actions-popup' style={style}>
      <PopupSurface>
        <div className='entity-actions-popup--close'>
          <ClickableIcon icon={<XIcon />} label='Close' onClick={onClose} />
        </div>
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
