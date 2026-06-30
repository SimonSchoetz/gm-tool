import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { FCProps } from '@/types';
import { calculateHorizontalClampOffset } from './helper';
import './EditorPopup.css';

const EDGE_PADDING = 12;

type Props = {
  getAnchorRect: () => DOMRect | null;
  children: ReactNode;
  onClickOutside?: () => void;
};

export const EditorPopup: FCProps<Props> = ({
  getAnchorRect,
  children,
  onClickOutside,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [, forceRerender] = useReducer((tick: number) => tick + 1, 0);
  const [horizontalOffset, setHorizontalOffset] = useState(0);

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
  console.log('>>>>>>>>>>', rect);

  useEffect(() => {
    if (!rect || !popupRef.current) return;
    const popup = popupRef.current;

    const resizeObserver = new ResizeObserver(() => {
      setHorizontalOffset(
        calculateHorizontalClampOffset({
          anchorCenterX: rect.left + rect.width / 2,
          popupWidth: popup.getBoundingClientRect().width,
          viewportWidth: window.innerWidth,
          edgePadding: EDGE_PADDING,
        }),
      );
    });
    resizeObserver.observe(popup);

    return () => {
      resizeObserver.disconnect();
    };
  }, [rect]);

  if (!rect) return null;

  return createPortal(
    <div
      ref={popupRef}
      className='editor-popup'
      style={{
        top: rect.top,
        left: rect.left + rect.width / 2 + horizontalOffset,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};
