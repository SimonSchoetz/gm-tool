import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import {
  calculateHorizontalClampOffset,
  calculateVerticalPlacement,
} from './helper';
import './AnchoredPopup.css';

const EDGE_PADDING = 12;

type Props = {
  getAnchorRect: () => DOMRect | null;
  children: ReactNode;
  onClickOutside?: () => void;
};

export const AnchoredPopup: FCProps<Props> = ({
  getAnchorRect,
  children,
  onClickOutside,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [, forceRerender] = useReducer((tick: number) => tick + 1, 0);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');

  useEffect(() => {
    // body has overflow:hidden — capture-phase document listener catches CustomScrollArea's scroll events without needing a ref to it.
    const handleScroll = () => {
      forceRerender();
    };
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!onClickOutside) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClickOutside]);

  const rect = getAnchorRect();

  useEffect(() => {
    if (!rect || !popupRef.current) return;
    const popup = popupRef.current;

    const resizeObserver = new ResizeObserver(() => {
      const popupRect = popup.getBoundingClientRect();
      setHorizontalOffset(
        calculateHorizontalClampOffset({
          anchorCenterX: rect.left + rect.width / 2,
          popupWidth: popupRect.width,
          viewportWidth: window.innerWidth,
          edgePadding: EDGE_PADDING,
        }),
      );
      setPlacement(
        calculateVerticalPlacement({
          anchorTop: rect.top,
          popupHeight: popupRect.height,
          edgePadding: EDGE_PADDING,
        }),
      );
    });
    resizeObserver.observe(popup);

    return () => {
      resizeObserver.disconnect();
    };
  }, [rect]);

  if (!rect) return;

  return createPortal(
    <div
      ref={popupRef}
      className={cn(
        'anchored-popup',
        placement === 'below' && 'anchored-popup--below',
      )}
      style={{
        top: placement === 'below' ? rect.bottom : rect.top,
        left: rect.left + rect.width / 2 + horizontalOffset,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};
