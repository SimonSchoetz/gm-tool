import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import type { CSSProperties } from 'react';
import { FCProps } from '@/types';
import { useImage, useUpdateImageFrame } from '@/data-access-layer';
import { ImageById } from '../../../../../ImageById/ImageById';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { clampFrame, computePanDelta } from './helper';
import type { FrameState } from './helper';
import './FramingOverlay.css';

const MAX_ZOOM = 5;
const ZOOM_STEP = 0.001;
const PERSIST_DEBOUNCE_MS = 600;

type Props = {
  imageId: string;
  dimensions: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
};

export const FramingOverlay: FCProps<Props> = ({ imageId, dimensions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIndicatorRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const { frame } = useImage(imageId);
  const { updateFrame } = useUpdateImageFrame(imageId);

  const [frameState, setFrameState] = useState<FrameState>(
    () => frame ?? { x: 50, y: 0, zoom: 1 },
  );

  const [maskSize, setMaskSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    // Measures the rendered frame indicator size so the mask hole matches exactly.
    const indicator = frameIndicatorRef.current;
    if (!indicator) return;
    const { width, height } = indicator.getBoundingClientRect();
    setMaskSize({ w: width, h: height });
  }, [dimensions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void updateFrame({
        x: frameState.x,
        y: frameState.y,
        zoom: frameState.zoom,
      });
    }, PERSIST_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [frameState, updateFrame]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFrameState((prev) =>
      clampFrame({ ...prev, zoom: prev.zoom - e.deltaY * ZOOM_STEP }, MAX_ZOOM),
    );
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || lastPointerRef.current === null) return;
      const container = containerRef.current;
      if (container === null) return;

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const { width, height } = container.getBoundingClientRect();
      setFrameState((prev) => {
        const delta = computePanDelta(dx, dy, width, height, prev.zoom);
        return clampFrame(
          { ...prev, x: prev.x - delta.dx, y: prev.y - delta.dy },
          MAX_ZOOM,
        );
      });
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  }, []);

  const frameStyle = {
    '--rt-framing-overlay-x': `${frameState.x}%`,
    '--rt-framing-overlay-y': `${frameState.y}%`,
    '--rt-framing-overlay-zoom': frameState.zoom,
  } as CSSProperties;

  const frameWidth = dimensions.width;
  const frameHeight = dimensions.height;
  const aspectRatio = `${String(frameWidth)} / ${String(frameHeight)}`;

  const maskStyle: CSSProperties =
    maskSize !== null
      ? ({
          '--rt-framing-overlay-frame-w': `${maskSize.w}px`,
          '--rt-framing-overlay-frame-h': `${maskSize.h}px`,
        } as CSSProperties)
      : {};

  return (
    <div
      ref={containerRef}
      className='framing-overlay'
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <ImageById
        imageId={imageId}
        alt='Framing preview'
        className='framing-overlay-image'
        style={frameStyle}
      />
      <div className='framing-overlay-mask' style={maskStyle} />
      <div
        ref={frameIndicatorRef}
        className='framing-overlay-frame'
        style={{ aspectRatio }}
      />
    </div>
  );
};
