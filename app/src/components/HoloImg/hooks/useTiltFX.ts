import { useEffect, type RefObject, useState } from 'react';

export type TiltFX = {
  cursorXPercent: number;
  cursorYPercent: number;
  rotationX: number;
  rotationY: number;
  distanceFromCenter: number;
  distanceFromCenterX: number;
  distanceFromCenterY: number;
  ratioX: number;
  ratioY: number;
  isActive: boolean;
};

const initialState: TiltFX = {
  cursorXPercent: 50,
  cursorYPercent: 50,
  rotationX: 0,
  rotationY: 0,
  distanceFromCenter: 0,
  distanceFromCenterX: 0,
  distanceFromCenterY: 0,
  ratioX: 1,
  ratioY: 1,
  isActive: false,
};

export const useTiltFX = (
  containerRef: RefObject<HTMLElement | null>,
): TiltFX => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        const cursorXPercent = (x / w) * 100;
        const cursorYPercent = (y / h) * 100;

        const maxRotation = 2;
        const rotationX = ((cursorYPercent - 50) / 50) * -maxRotation;
        const rotationY = ((cursorXPercent - 50) / 50) * maxRotation;

        const centerX = cursorXPercent - 50;
        const centerY = cursorYPercent - 50;
        const distanceFromCenter = Math.min(
          Math.sqrt(centerX ** 2 + centerY ** 2) / 50,
          1,
        );
        const distanceFromCenterX = Math.abs(centerX) / 50;
        const distanceFromCenterY = Math.abs(centerY) / 50;

        const minDim = Math.min(w, h);
        const ratioX = w / minDim;
        const ratioY = h / minDim;

        setState({
          cursorXPercent,
          cursorYPercent,
          rotationX,
          rotationY,
          distanceFromCenter,
          distanceFromCenterX,
          distanceFromCenterY,
          ratioX,
          ratioY,
          isActive: true,
        });
      });
    };

    const handleMouseLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setState(initialState);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef]);

  return state;
};
