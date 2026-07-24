import { useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { TextFormatType } from 'lexical';
import { usePinnedPopups } from '@/providers';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { buildEntityPath } from '@domain';
import { useMentionEntityData, useTableConfigs } from '@/data-access-layer';
import type { PopupPlacement } from '../../../MentionPopup';
import { buildMentionTextDecoration } from './helper';
import './MentionBadge.css';

type Props = {
  entityId: string;
  entityType: string;
  displayName: string;
  adventureId: string | null;
  format: TextFormatType[];
};

export const MentionBadge: FCProps<Props> = ({
  entityId,
  entityType,
  displayName,
  adventureId,
  format,
}) => {
  const navigate = useNavigate();
  const { showPopup, hidePopup, hasPopup } = usePinnedPopups();
  const {
    name: liveName,
    deleted,
    loading,
  } = useMentionEntityData(entityId, entityType);
  const { tableConfigs } = useTableConfigs();

  const tableConfig = tableConfigs.find((c) => c.table_name === entityType);
  const resolvedColor = tableConfig?.color ?? null;
  const resolvedName = !loading && liveName !== null ? liveName : displayName;

  const badgeRef = useRef<HTMLSpanElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      adventureId,
      name: resolvedName,
      position: { x: rect.left, y },
      placement,
      onMouseEnterBridge: () => {
        isMouseOnPopupRef.current = true;
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
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
    hoverTimerRef.current = setTimeout(showPopupFromBadge, 500);
  };

  const handleBadgeMouseLeave = () => {
    isMouseOnBadgeRef.current = false;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (!isMouseOnPopupRef.current) {
        hidePopup(entityId);
      }
    }, 0);
  };

  const handleClick = () => {
    hidePopup(entityId);
    const path = buildEntityPath(entityType, entityId, adventureId);
    void navigate({ to: path });
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (deleted) {
    return (
      <span className='mention-badge mention-badge--deleted'>
        {displayName}
      </span>
    );
  }

  return (
    <span
      ref={badgeRef}
      className={cn(
        'mention-badge',
        format.includes('bold') && 'mention-badge--bold',
        format.includes('italic') && 'mention-badge--italic',
      )}
      style={
        {
          '--rt-mention-badge-color': resolvedColor,
          '--mention-badge-text-decoration': buildMentionTextDecoration(format),
        } as React.CSSProperties
      }
      onClick={handleClick}
      onMouseEnter={handleBadgeMouseEnter}
      onMouseLeave={handleBadgeMouseLeave}
    >
      {resolvedName}
    </span>
  );
};
