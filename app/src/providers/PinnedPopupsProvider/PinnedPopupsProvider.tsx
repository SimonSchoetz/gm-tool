import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouterState } from '@tanstack/react-router';
import { FCProps } from '@/types/fcProps.type';
import { MentionPopup } from '@/components/MentionPopup';
import type { PopupPosition } from '@/components/MentionPopup';
import {
  PinnedPopupsContext,
  ShowPopupArgs,
  PinnedPopupsContextValue,
} from '../PinnedPopupsContext';
import type { PopupEntry } from './popupEntry';
import { requestPopup } from './helper/requestPopup';
import './PinnedPopupsProvider.css';

type Props = { children: ReactNode };

export const PinnedPopupsProvider: FCProps<Props> = ({ children }) => {
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const topZRef = useRef(1000);

  const routerState = useRouterState();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional route-change cleanup; setState is stable and no external subscription is needed
    setPopups([]);
  }, [routerState.location.pathname]);

  const requestPopupWithMode = (
    args: ShowPopupArgs,
    mode: 'hover' | 'click',
  ) => {
    topZRef.current += 1;
    const zIndex = topZRef.current;
    setPopups((prev) => requestPopup(prev, args, zIndex, mode));
  };

  const showPopup = (args: ShowPopupArgs) => {
    requestPopupWithMode(args, 'hover');
  };

  const openPopupByClick = (args: ShowPopupArgs) => {
    requestPopupWithMode(args, 'click');
  };

  const hidePopup = (entityId: string) => {
    setPopups((prev) =>
      prev.filter((p) => p.entityId !== entityId || p.mode !== 'hover'),
    );
  };

  const pinPopup = (entityId: string) => {
    setPopups((prev) =>
      prev.map((p) =>
        p.entityId === entityId
          ? {
              ...p,
              mode: 'pinned',
              onMouseEnterBridge: null,
              onMouseLeaveBridge: null,
            }
          : p,
      ),
    );
  };

  const removePopup = (entityId: string) => {
    setPopups((prev) => prev.filter((p) => p.entityId !== entityId));
  };

  const hasPopup = (entityId: string) =>
    popups.some((p) => p.entityId === entityId);

  const updatePopupZIndex = (entityId: string, zIndex: number) => {
    setPopups((prev) =>
      prev.map((p) => (p.entityId === entityId ? { ...p, zIndex } : p)),
    );
  };

  const updatePopupPosition = (entityId: string, position: PopupPosition) => {
    setPopups((prev) =>
      prev.map((p) => (p.entityId === entityId ? { ...p, position } : p)),
    );
  };

  const contextValue: PinnedPopupsContextValue = {
    showPopup,
    openPopupByClick,
    hidePopup,
    hasPopup,
  };

  return (
    <PinnedPopupsContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className='pinned-popups-stack'>
          {popups.map((entry) => {
            const {
              anchor,
              onMouseEnterBridge,
              onMouseLeaveBridge,
              ...entrySpread
            } = entry;
            return (
              <MentionPopup
                // useDraggable copies initialPosition into state once, so the remount on a changed anchor is what moves a re-anchored popup; keying on position would remount on every drag.
                key={`${entry.entityId}-${anchor.x}-${anchor.y}`}
                {...entrySpread}
                onRemove={() => {
                  removePopup(entry.entityId);
                }}
                onPin={() => {
                  pinPopup(entry.entityId);
                }}
                onPositionChange={(pos) => {
                  updatePopupPosition(entry.entityId, pos);
                }}
                onBringToFront={() => {
                  topZRef.current += 1;
                  updatePopupZIndex(entry.entityId, topZRef.current);
                }}
                {...(onMouseEnterBridge !== null && { onMouseEnterBridge })}
                {...(onMouseLeaveBridge !== null && { onMouseLeaveBridge })}
              />
            );
          })}
        </div>,
        document.body,
      )}
    </PinnedPopupsContext.Provider>
  );
};
