import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import { usePinnedPopups } from '@/providers';
import { FCProps } from '@/types';
import { buildEntityPath } from '@/domain';
import { MentionPopup } from '../../../MentionPopup';
import type { PopupPosition, PopupPlacement } from '../../../MentionPopup';
import './MentionBadge.css';

type Props = {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string | null;
};

export const MentionBadge: FCProps<Props> = ({
  entityId,
  entityType,
  displayName,
  color,
  adventureId,
}) => {
  const navigate = useNavigate();
  const { pinPopup, isPinned } = usePinnedPopups();

  const [popupState, setPopupState] = useState<{
    position: PopupPosition;
    placement: PopupPlacement;
  } | null>(null);

  const badgeRef = useRef<HTMLSpanElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseOnBadgeRef = useRef(false);
  const isMouseOnPopupRef = useRef(false);

  const closePopup = () => {
    setPopupState(null);
  };

  const showPopup = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const placement: PopupPlacement =
      rect.top > window.innerHeight / 2 ? 'above' : 'below';
    const y = placement === 'below' ? rect.bottom : rect.top;
    setPopupState({ position: { x: rect.left, y }, placement });
  };

  const handleBadgeMouseEnter = () => {
    if (isPinned(entityId)) return;
    isMouseOnBadgeRef.current = true;
    hoverTimerRef.current = setTimeout(showPopup, 2000);
  };

  const handleBadgeMouseLeave = () => {
    isMouseOnBadgeRef.current = false;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!isMouseOnPopupRef.current) {
      closePopup();
    }
  };

  const handlePopupMouseEnter = () => {
    isMouseOnPopupRef.current = true;
  };

  const handlePopupMouseLeave = () => {
    isMouseOnPopupRef.current = false;
    if (!isMouseOnBadgeRef.current) {
      closePopup();
    }
  };

  const handlePin = () => {
    if (!popupState) return;
    pinPopup({
      entityId,
      entityType,
      adventureId: adventureId ?? null,
      position: popupState.position,
      placement: popupState.placement,
    });
    closePopup();
  };

  const handleClick = () => {
    closePopup();
    const path = buildEntityPath(entityType, entityId, adventureId ?? null);
    void navigate({ to: path });
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={badgeRef}
        className='mention-badge'
        style={{ '--rt-color': color } as React.CSSProperties}
        onClick={handleClick}
        onMouseEnter={handleBadgeMouseEnter}
        onMouseLeave={handleBadgeMouseLeave}
      >
        {displayName}
      </span>
      {popupState &&
        createPortal(
          <MentionPopup
            entityId={entityId}
            entityType={entityType}
            adventureId={adventureId ?? null}
            position={popupState.position}
            placement={popupState.placement}
            initialIsPinned={false}
            onRemove={closePopup}
            onPin={handlePin}
            onMouseEnterBridge={handlePopupMouseEnter}
            onMouseLeaveBridge={handlePopupMouseLeave}
          />,
          document.body,
        )}
    </>
  );
};
