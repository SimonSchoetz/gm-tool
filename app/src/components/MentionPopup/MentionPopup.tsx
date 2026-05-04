import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/util';
import { useDraggable } from '@/hooks';
import { PinIcon, PinOffIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import GlassPanel from '../GlassPanel/GlassPanel';
import { ClickableIcon } from '../ClickableIcon';
import { MentionPopupContent } from '../MentionPopupContent';
import { FCProps } from '@/types';
import './MentionPopup.css';

export type PopupPosition = { x: number; y: number };
export type PopupPlacement = 'above' | 'below';

type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  position: PopupPosition;
  placement: PopupPlacement;
  zIndex?: number;
  initialIsPinned: boolean;
  onRemove: () => void;
  onPin?: () => void;
  onPositionChange?: (pos: PopupPosition) => void;
  onBringToFront?: () => void;
  onMouseEnterBridge?: () => void;
  onMouseLeaveBridge?: () => void;
};

export const MentionPopup: FCProps<Props> = ({
  entityId,
  entityType,
  adventureId,
  position,
  placement,
  zIndex,
  initialIsPinned,
  onRemove,
  onPin,
  onPositionChange,
  onBringToFront,
  onMouseEnterBridge,
  onMouseLeaveBridge,
}) => {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [isHovered, setIsHovered] = useState(false);

  const { position: dragPosition, draggableProps } = useDraggable(
    position,
    onPositionChange,
  );

  const navigate = useNavigate();

  const handleNavigate = () => {
    const entitySegment = entityType.slice(0, -1);
    const path = adventureId
      ? `/adventure/${adventureId}/${entitySegment}/${entityId}`
      : `/${entitySegment}/${entityId}`;
    onRemove();
    void navigate({ to: path });
  };

  const handlePin = () => {
    setIsPinned(true);
    onPin?.();
  };

  const handleUnpin = () => {
    setIsPinned(false);
    if (!isHovered) {
      onRemove();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnterBridge?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeaveBridge?.();
    if (!isPinned) {
      onRemove();
    }
  };

  return (
    <GlassPanel
      className={cn('mention-popup', `mention-popup--${placement}`)}
      style={
        {
          '--rt-x': `${dragPosition.x}px`,
          '--rt-y': `${dragPosition.y}px`,
          ...(zIndex !== undefined && { zIndex }),
        } as React.CSSProperties
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => onBringToFront?.()}
    >
      <div
        className='mention-popup-drag-handle'
        {...(isPinned ? draggableProps : {})}
      >
        <div className='mention-popup-menu-bar'>
          {!isPinned && (
            <ClickableIcon
              icon={<PinIcon />}
              onClick={handlePin}
              label='Pin popup'
              title='Pin'
            />
          )}
          {isPinned && (
            <ClickableIcon
              icon={<PinOffIcon />}
              onClick={handleUnpin}
              label='Unpin popup'
              title='Unpin'
            />
          )}
          <ClickableIcon
            icon={<ExternalLinkIcon />}
            onClick={handleNavigate}
            label='Navigate to entity'
            title='Navigate'
          />
          <ClickableIcon
            icon={<XIcon />}
            onClick={onRemove}
            label='Close popup'
            title='Close'
          />
        </div>
      </div>

      <MentionPopupContent
        entityId={entityId}
        entityType={entityType}
        adventureId={adventureId}
      />
    </GlassPanel>
  );
};
