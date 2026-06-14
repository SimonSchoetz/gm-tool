import { useEffect, type RefObject, type CSSProperties, useState } from 'react';

type CardVars = {
  '--tilt-fx-cursor-x-percent': string;
  '--tilt-fx-cursor-y-percent': string;
  '--tilt-fx-rotation-x-degrees': string;
  '--tilt-fx-rotation-y-degrees': string;
  '--tilt-fx-rotation-x-degrees-num': number;
  '--tilt-fx-rotation-y-degrees-num': number;
  '--tilt-fx-distance-from-center': string;
  '--tilt-fx-distance-from-center-x': string;
  '--tilt-fx-distance-from-center-y': string;
} & CSSProperties;

type CardState = {
  cursorXPercent: number;
  cursorYPercent: number;
  rotationX: number;
  rotationY: number;
  distanceFromCenter: number;
  distanceFromCenterX: number;
  distanceFromCenterY: number;

  isActive: boolean;
};

const initialState: CardState = {
  cursorXPercent: 50,
  cursorYPercent: 50,
  rotationX: 0,
  rotationY: 0,
  distanceFromCenter: 0,
  distanceFromCenterX: 0,
  distanceFromCenterY: 0,

  isActive: false,
};

export const useTiltFX = (
  containerRef: RefObject<HTMLElement | null>,
): { cardVars: CardVars; isActive: boolean } => {
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

        setState({
          cursorXPercent,
          cursorYPercent,
          rotationX,
          rotationY,
          distanceFromCenter,
          distanceFromCenterX,
          distanceFromCenterY,
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

  const cardVars: CardVars = {
    '--tilt-fx-cursor-x-percent': `${state.cursorXPercent}%`,
    '--tilt-fx-cursor-y-percent': `${state.cursorYPercent}%`,
    '--tilt-fx-rotation-x-degrees': `${state.rotationX}deg`,
    '--tilt-fx-rotation-y-degrees': `${state.rotationY}deg`,
    '--tilt-fx-rotation-x-degrees-num': state.rotationX,
    '--tilt-fx-rotation-y-degrees-num': state.rotationY,
    '--tilt-fx-distance-from-center': String(state.distanceFromCenter),
    '--tilt-fx-distance-from-center-x': String(state.distanceFromCenterX),
    '--tilt-fx-distance-from-center-y': String(state.distanceFromCenterY),
  };

  return {
    cardVars,
    isActive: state.isActive,
  };
};
