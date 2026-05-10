import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/util';
import { buildEntityPath } from '@domain';
import { useDraggable } from '@/hooks';
import GlassPanel from '../GlassPanel/GlassPanel';
import { MentionPopupHeader, MentionPopupContent } from './components';
import { FCProps } from '@/types';
import './MentionPopup.css';

export type PopupPosition = { x: number; y: number };
export type PopupPlacement = 'above' | 'below';

type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
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
  name,
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

  const { position: dragPosition, draggableProps } = useDraggable(
    position,
    onPositionChange,
  );

  const navigate = useNavigate();

  const handleNavigate = () => {
    const path = buildEntityPath(entityType, entityId, adventureId);
    onRemove();
    void navigate({ to: path });
  };

  const handlePin = () => {
    setIsPinned(true);
    onPin?.();
  };

  const handleMouseLeave = () => {
    onMouseLeaveBridge?.();
    if (!isPinned) {
      onRemove();
    }
  };

  return (
    <GlassPanel
      intensity='bright'
      className={cn('mention-popup', `mention-popup--${placement}`)}
      style={
        {
          '--rt-mention-pop-up-x': `${dragPosition.x}px`,
          '--rt-mention-pop-up-y': `${dragPosition.y}px`,
          ...(zIndex !== undefined && { zIndex }),
        } as React.CSSProperties
      }
      onMouseEnter={onMouseEnterBridge}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => onBringToFront?.()}
    >
      <MentionPopupHeader
        name={name}
        isPinned={isPinned}
        draggableProps={draggableProps}
        onPin={handlePin}
        onRemove={onRemove}
        onNavigate={handleNavigate}
      />

      <MentionPopupContent
        entityId={entityId}
        entityType={entityType}
        adventureId={adventureId}
      />
    </GlassPanel>
  );
};
