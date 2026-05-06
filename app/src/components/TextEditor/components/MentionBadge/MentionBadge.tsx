import { useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePinnedPopups } from '@/providers';
import { FCProps } from '@/types';
import { buildEntityPath } from '@/domain';
import type { PopupPlacement } from '@/components';
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
  const { showPopup, hidePopup, hasPopup } = usePinnedPopups();

  const badgeRef = useRef<HTMLSpanElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseOnBadgeRef = useRef(false);
  const isMouseOnPopupRef = useRef(false);

  const showPopupFromBadge = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const placement: PopupPlacement =
      rect.top > window.innerHeight / 2 ? 'above' : 'below';
    const y = placement === 'below' ? rect.bottom : rect.top;
    showPopup({
      entityId,
      entityType,
      adventureId: adventureId ?? null,
      name: displayName,
      position: { x: rect.left, y },
      placement,
      onMouseEnterBridge: () => {
        isMouseOnPopupRef.current = true;
      },
      onMouseLeaveBridge: () => {
        isMouseOnPopupRef.current = false;
        if (!isMouseOnBadgeRef.current) {
          hidePopup(entityId);
        }
      },
    });
  };

  const handleBadgeMouseEnter = () => {
    if (hasPopup(entityId)) return;
    isMouseOnBadgeRef.current = true;
    hoverTimerRef.current = setTimeout(showPopupFromBadge, 2000);
  };

  const handleBadgeMouseLeave = () => {
    isMouseOnBadgeRef.current = false;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!isMouseOnPopupRef.current) {
      hidePopup(entityId);
    }
  };

  const handleClick = () => {
    hidePopup(entityId);
    const path = buildEntityPath(entityType, entityId, adventureId ?? null);
    void navigate({ to: path });
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
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
  );
};
