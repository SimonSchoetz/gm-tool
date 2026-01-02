import { useEffect, type RefObject, type CSSProperties, useState } from 'react';

type CardVars = {
  '--mx': string;
  '--my': string;
  '--posx': string;
  '--posy': string;
  '--rx': string;
  '--ry': string;
  '--rx-num': number;
  '--ry-num': number;
  '--hyp': string;
} & CSSProperties;

type CardState = {
  mx: number;
  my: number;
  rx: number;
  ry: number;
  hyp: number;
  isActive: boolean;
};

const initialState: CardState = {
  mx: 50,
  my: 50,
  rx: 0,
  ry: 0,
  hyp: 0,
  isActive: false,
};

export const useTiltFX = (
  containerRef: RefObject<HTMLElement | null>
): { cardVars: CardVars; isActive: boolean } => {
  const [state, setState] = useState<CardState>(initialState);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        const mx = (x / w) * 100;
        const my = (y / h) * 100;

        const maxRotation = 1;
        const rx = ((my - 50) / 50) * -maxRotation;
        const ry = ((mx - 50) / 50) * maxRotation;

        const centerX = mx - 50;
        const centerY = my - 50;
        const hyp = Math.min(Math.sqrt(centerX ** 2 + centerY ** 2) / 50, 1);

        setState({ mx, my, rx, ry, hyp, isActive: true });
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
  }, []);

  const cardVars: CardVars = {
    '--mx': `${state.mx}%`,
    '--my': `${state.my}%`,
    '--posx': `${state.mx}%`,
    '--posy': `${state.my}%`,
    '--rx': `${state.rx}deg`,
    '--ry': `${state.ry}deg`,
    '--rx-num': state.rx,
    '--ry-num': state.ry,
    '--hyp': String(state.hyp),
  };

  return {
    cardVars,
    isActive: state.isActive,
  };
};
