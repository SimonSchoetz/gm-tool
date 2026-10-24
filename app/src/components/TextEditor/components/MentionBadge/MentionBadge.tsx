import { useRef, useEffect } from 'react';
import type { TextFormatType } from 'lexical';
import { usePinnedPopups } from '@/providers/PinnedPopupsContext';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import {
  useMentionEntityData,
  useTableConfigs,
  usePrefetchMentionEntity,
} from '@/data-access-layer';
import type { PopupPlacement } from '../../../MentionPopup';
import { buildMentionTextDecoration } from './helper/buildMentionTextDecoration';
import { hasPointerMoved } from './helper/hasPointerMoved';
import { isPrimaryButtonDown } from './helper/isPrimaryButtonDown';
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
  const { showPopup, openPopupByClick, hidePopup, hasPopup } =
    usePinnedPopups();
  const {
    name: liveName,
    deleted,
    loading,
  } = useMentionEntityData(entityId, entityType);
  const { tableConfigs } = useTableConfigs();
  const { prefetchMentionEntity } = usePrefetchMentionEntity(
    entityId,
    entityType,
  );

  const tableConfig =
    tableConfigs.find((c) => c.table_name === entityType) ?? null;
  const resolvedColor = tableConfig?.color ?? null;
  const resolvedName = !loading && liveName !== null ? liveName : displayName;

  const badgeRef = useRef<HTMLSpanElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseOnBadgeRef = useRef(false);
  const isMouseOnPopupRef = useRef(false);
  const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null);

  const readPopupAnchor = () => {
    if (!badgeRef.current) return null;
    const rect = badgeRef.current.getBoundingClientRect();
    const placement: PopupPlacement =
      rect.top > window.innerHeight / 2 ? 'above' : 'below';
    const y = placement === 'below' ? rect.bottom : rect.top;
    return { position: { x: rect.left, y }, placement };
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const showPopupFromBadge = () => {
    const anchor = readPopupAnchor();
    if (anchor === null) return;
    showPopup({
      entityId,
      entityType,
      adventureId,
      name: resolvedName,
      ...anchor,
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

  const handleBadgeMouseEnter = (event: React.MouseEvent) => {
    if (hasPopup(entityId)) return;
    if (isPrimaryButtonDown(event.buttons)) return;
    isMouseOnBadgeRef.current = true;
    // must run alongside the delay timer, not inside showPopupFromBadge — moving it into the timer callback reintroduces the visible popup fill-in
    prefetchMentionEntity();
    hoverTimerRef.current = setTimeout(showPopupFromBadge, 500);
  };

  const handleBadgeMouseLeave = () => {
    isMouseOnBadgeRef.current = false;
    clearHoverTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (!isMouseOnPopupRef.current) {
        hidePopup(entityId);
      }
    }, 0);
  };

  const handleBadgeMouseDown = (event: React.MouseEvent) => {
    mouseDownPositionRef.current = { x: event.clientX, y: event.clientY };
    clearHoverTimer();
  };

  const handleClick = (event: React.MouseEvent) => {
    clearHoverTimer();
    const mouseDownPosition = mouseDownPositionRef.current;
    mouseDownPositionRef.current = null;
    if (
      hasPointerMoved(mouseDownPosition, { x: event.clientX, y: event.clientY })
    ) {
      return;
    }
    const anchor = readPopupAnchor();
    if (anchor === null) return;
    openPopupByClick({
      entityId,
      entityType,
      adventureId,
      name: resolvedName,
      ...anchor,
    });
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (deleted) {
    return (
      <span
        ref={badgeRef}
        className={cn(
          'mention-badge',
          'mention-badge--deleted',
          format.includes('bold') && 'mention-badge--bold',
          format.includes('italic') && 'mention-badge--italic',
        )}
        style={
          {
            '--mention-badge-text-decoration':
              buildMentionTextDecoration(format),
          } as React.CSSProperties
        }
        data-mention-anchor={entityId}
        onMouseDown={handleBadgeMouseDown}
        onClick={handleClick}
        onMouseEnter={handleBadgeMouseEnter}
        onMouseLeave={handleBadgeMouseLeave}
      >
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
      data-mention-anchor={entityId}
      onMouseDown={handleBadgeMouseDown}
      onClick={handleClick}
      onMouseEnter={handleBadgeMouseEnter}
      onMouseLeave={handleBadgeMouseLeave}
    >
      {resolvedName}
    </span>
  );
};
