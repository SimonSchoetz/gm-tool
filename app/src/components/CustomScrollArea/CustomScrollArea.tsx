import { useEffect, useRef, useState } from 'react';
import { cn } from '../../util/className';
import { HtmlProps } from '../../types/htmlProps.type';
import { FCProps } from '../../types/fcProps.type';
import './CustomScrollArea.css';

type CustomScrollAreaProps = {
  thumbMinHeight?: number;
  scrollbarWidth?: number;
  spacing?: number;
} & HtmlProps<'div'>;

export const CustomScrollArea: FCProps<CustomScrollAreaProps> = ({
  children,
  className,
  suppressContentEditableWarning,
  thumbMinHeight = 40,
  scrollbarWidth = 8,
  spacing = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const perspectiveRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollNeeded, setIsScrollNeeded] = useState(false);

  // Check if scroll is needed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollNeeded = () => {
      const scrollerHeight = container.getBoundingClientRect().height;
      const scrollHeight = container.scrollHeight;
      const needsScroll = scrollHeight > scrollerHeight;
      setIsScrollNeeded(needsScroll);
    };

    checkScrollNeeded();

    const resizeObserver = new ResizeObserver(checkScrollNeeded);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(checkScrollNeeded);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Style the thumb when it's available
  useEffect(() => {
    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb || !isScrollNeeded) return;

    const updateThumbStyle = () => {
      const viewport = container.getBoundingClientRect();
      const scrollHeight = container.scrollHeight;
      const maxScrollTop = scrollHeight - viewport.height;

      // Calculate thumb height
      const thumbHeight =
        Math.max(Math.pow(viewport.height, 2) / scrollHeight, thumbMinHeight) -
        spacing * 2;

      const maxTopOffset = viewport.height - thumbHeight;
      const scaling = maxTopOffset / maxScrollTop;

      // Apply styles with correct transform order: scale, matrix3d, translateZ
      thumb.style.height = `${thumbHeight - spacing * 2}px`;
      thumb.style.width = `${scrollbarWidth}px`;
      thumb.style.right = `-${spacing * 0.5}px`;
      thumb.style.top = `-${spacing ? spacing * 2 : 2}px`;
      thumb.style.transform = `
        scale(${1 / scaling})
        matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1)
        translateZ(${-2 + 1 - 1 / scaling}px)
      `;
    };

    updateThumbStyle();

    // Observe container size changes (window resize)
    const resizeObserver = new ResizeObserver(updateThumbStyle);
    resizeObserver.observe(container);

    // Observe content changes (children added/removed/modified)
    const mutationObserver = new MutationObserver(updateThumbStyle);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [isScrollNeeded, thumbMinHeight, scrollbarWidth, spacing]);

  return (
    <div
      ref={containerRef}
      className={cn('custom-scroll-area', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div
        ref={perspectiveRef}
        style={{ padding: `${spacing}px` }}
        className='perspective-container'
      >
        {isScrollNeeded && (
          <div
            ref={thumbRef}
            className={cn(
              'custom-scrollbar-thumb',
              !isHovered && 'custom-scrollbar-thumb--hidden',
            )}
          />
        )}
        {children}
      </div>
    </div>
  );
};
