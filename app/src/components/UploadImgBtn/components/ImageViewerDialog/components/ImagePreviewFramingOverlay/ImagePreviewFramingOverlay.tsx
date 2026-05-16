import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { FCProps } from '@/types';
import { useImage, useUpdateImageFrame } from '@/data-access-layer';
import { ImageById } from '../../../../../ImageById/ImageById';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { clampFrame, computePanDelta } from './helper';
import type { FrameState } from './helper';
import './ImagePreviewFramingOverlay.css';
import { IpfoBgImg } from './components';
import { IPFO_FRAME_BORDER_WIDTH } from './ImagePreviewFramingOverlay.constants';

const MAX_ZOOM = 5;
const ZOOM_STEP = 0.001;
const PERSIST_DEBOUNCE_MS = 600;

type Props = {
  imageId: string;
  dimensions: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
};

export const ImagePreviewFramingOverlay: FCProps<Props> = ({
  imageId,
  dimensions,
}) => {
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const { frame } = useImage(imageId);
  const { updateFrame } = useUpdateImageFrame(imageId);
  // Ref keeps updateFrame current without making it a reactive dep — avoids a
  // mutation-invalidation → re-render → new updateFrame ref → re-effect loop.
  const updateFrameRef = useRef(updateFrame);
  useEffect(() => {
    updateFrameRef.current = updateFrame;
  });

  const [frameState, setFrameState] = useState<FrameState>(
    () => frame ?? { x: 50, y: 0, zoom: 1 },
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void updateFrameRef.current({
        x: frameState.x,
        y: frameState.y,
        zoom: frameState.zoom,
      });
    }, PERSIST_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [frameState]);

  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = overlayRef.current;
    if (el === null) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setFrameState((prev) =>
        clampFrame(
          { ...prev, zoom: prev.zoom - e.deltaY * ZOOM_STEP },
          MAX_ZOOM,
        ),
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
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

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      setFrameState((prev) => {
        const delta = computePanDelta(
          dx,
          dy,
          dimensions.width,
          dimensions.height,
          prev.zoom,
        );
        return clampFrame(
          { ...prev, x: prev.x - delta.dx, y: prev.y - delta.dy },
          MAX_ZOOM,
        );
      });
    },
    [dimensions],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  }, []);

  const overlayStyle = {
    '--rt-ipfo-x': `${frameState.x}%`,
    '--rt-ipfo-y': `${frameState.y}%`,
    '--rt-ipfo-zoom': frameState.zoom,
    '--rt-ipfo-frame-w': `${dimensions.width}px`,
    '--rt-ipfo-frame-h': `${dimensions.height}px`,
    '--ipfo-frame-border-width': `${IPFO_FRAME_BORDER_WIDTH}px`,
  } as CSSProperties;

  return (
    <div
      ref={overlayRef}
      className='ipfo'
      style={overlayStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <IpfoBgImg
        imageId={imageId}
        dimensions={dimensions}
        frameState={frameState}
      />
      <div className='ipfo-image-frame'>
        <ImageById
          imageId={imageId}
          alt='Framing preview'
          className='ipfo-image'
        />
      </div>
    </div>
  );
};
