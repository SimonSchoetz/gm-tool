import { useState, useRef, useLayoutEffect } from 'react';
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

  const popupRef = useRef<HTMLDivElement>(null);
  const [clampedPosition, setClampedPosition] = useState(dragPosition);

  useLayoutEffect(() => {
    // Reads popup dimensions via getBoundingClientRect to clamp position within
    // viewport; must apply before first paint to prevent the popup appearing
    // off-screen when spawned near a window boundary
    if (!popupRef.current) return;
    const { width, height } = popupRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(dragPosition.x, window.innerWidth - width));
    const y =
      placement === 'below'
        ? Math.max(0, Math.min(dragPosition.y, window.innerHeight - height))
        : Math.max(height, Math.min(dragPosition.y, window.innerHeight));
    setClampedPosition({ x, y });
  }, [dragPosition.x, dragPosition.y, placement]);

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
      ref={popupRef}
      intensity='bright'
      className={cn('mention-popup', `mention-popup--${placement}`)}
      style={
        {
          '--rt-mention-pop-up-x': `${clampedPosition.x}px`,
          '--rt-mention-pop-up-y': `${clampedPosition.y}px`,
          ...(zIndex !== undefined && { zIndex }),
        } as React.CSSProperties
      }
      onMouseEnter={onMouseEnterBridge}
      onMouseLeave={handleMouseLeave}
      onMouseDown={onBringToFront}
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
