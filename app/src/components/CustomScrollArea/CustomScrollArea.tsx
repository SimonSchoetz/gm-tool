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
  spacing = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const perspectiveRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const scalingRef = useRef<number>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollNeeded, setIsScrollNeeded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

      // Store scaling for drag calculations
      scalingRef.current = scaling;
      const ROUNDING_OFFSET = 2;
      thumb.style.height = `${thumbHeight - ROUNDING_OFFSET}px`;
      thumb.style.right = `-${spacing * 0.5}px`;
      thumb.style.top = `-${ROUNDING_OFFSET}px`;
      // Apply styles with correct transform order: scale, matrix3d, translateZ
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
  }, [isScrollNeeded, thumbMinHeight, spacing]);

  // Drag handlers
  const lastYRef = useRef<number>(0);

  const handleThumbMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    lastYRef.current = event.clientY;
    event.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;

    const handleMouseMove = (event: MouseEvent) => {
      const clientY = event.clientY;
      const delta = clientY - lastYRef.current;
      container.scrollTop += delta / scalingRef.current;
      lastYRef.current = clientY;
      event.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={cn('custom-scroll-area', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {isScrollNeeded && (
        <div
          ref={thumbRef}
          className={cn(
            'custom-scrollbar-thumb',
            !isHovered && !isDragging && 'custom-scrollbar-thumb--hidden',
            isDragging && 'custom-scrollbar-thumb--dragging',
          )}
          onMouseDown={handleThumbMouseDown}
        />
      )}
      <div
        ref={perspectiveRef}
        style={{ paddingRight: `${isScrollNeeded ? 12 : 0}px` }}
        className='perspective-container'
      >
        {children}
      </div>
    </div>
  );
};
