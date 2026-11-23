import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { useEscapeDismiss } from '@/hooks/useEscapeDismiss';
import { cn } from '@/util/className';
import { calculateHorizontalClampOffset } from './helper/calculateHorizontalClampOffset';
import { calculateVerticalPlacement } from './helper/calculateVerticalPlacement';
import './AnchoredPopup.css';

type Props = {
  getAnchorRect: () => DOMRect | null;
  children: ReactNode;
  onDismiss?: (event: MouseEvent | KeyboardEvent) => void;
  zIndex?: number | null;
  side?: 'left';
};

export const AnchoredPopup: FCProps<Props> = ({
  getAnchorRect,
  children,
  onDismiss,
  zIndex,
  side,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (!onDismiss) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onDismiss(event);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onDismiss]);

  useEscapeDismiss((event) => {
    onDismiss?.(event);
  }, onDismiss !== undefined);

  const rect = getAnchorRect();

  useEffect(() => {
    if (!rect || !popupRef.current || side === 'left') return;
    const popup = popupRef.current;

    const resizeObserver = new ResizeObserver(() => {
      const popupRect = popup.getBoundingClientRect();
      setHorizontalOffset(
        calculateHorizontalClampOffset({
          anchorCenterX: rect.left + rect.width / 2,
          popupWidth: popupRect.width,
          viewportWidth: window.innerWidth,
        }),
      );
      setPlacement(
        calculateVerticalPlacement({
          anchorTop: rect.top,
          popupHeight: popupRect.height,
        }),
      );
    });
    resizeObserver.observe(popup);

    return () => {
      resizeObserver.disconnect();
    };
  }, [rect, side]);

  if (!rect) return;

  return createPortal(
    <div
      ref={popupRef}
      className={cn(
        'anchored-popup',
        placement === 'below' && 'anchored-popup--below',
        side === 'left' && 'anchored-popup--left',
      )}
      style={
        side === 'left'
          ? {
              top: rect.top + rect.height / 2,
              left: rect.left,
              zIndex: zIndex ?? undefined,
            }
          : {
              top: placement === 'below' ? rect.bottom : rect.top,
              left: rect.left + rect.width / 2 + horizontalOffset,
              zIndex: zIndex ?? undefined,
            }
      }
    >
      {children}
    </div>,
    document.body,
  );
};
