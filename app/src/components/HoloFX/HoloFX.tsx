import { FCProps, HtmlProps } from '@/types';
import {
  PropsWithChildren,
  useRef,
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
} from 'react';
import './HoloFX.css';
import { cn } from '@/util';
import { Glare, Shimmer } from './components';

type Props = PropsWithChildren<HtmlProps<'div'>>;

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

export const HoloFX: FCProps<Props> = ({ className, children, ...props }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CardState>(initialState);
  const rafIdRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule update for next animation frame
    rafIdRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      // Calculate percentages (0-100)
      const mx = (x / w) * 100;
      const my = (y / h) * 100;

      // Calculate rotation (±15 degrees max)
      const maxRotation = 1;
      const rx = ((my - 50) / 50) * -maxRotation;
      const ry = ((mx - 50) / 50) * maxRotation;

      // Calculate hypotenuse (distance from center, normalized 0-1)
      const centerX = mx - 50;
      const centerY = my - 50;
      const hyp = Math.min(Math.sqrt(centerX ** 2 + centerY ** 2) / 50, 1);

      setState({ mx, my, rx, ry, hyp, isActive: true });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setState(initialState);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const cardVars = {
    '--mx': `${state.mx}%`,
    '--my': `${state.my}%`,
    '--posx': `${state.mx}%`,
    '--posy': `${state.my}%`,
    '--rx': `${state.rx}deg`,
    '--ry': `${state.ry}deg`,
    '--hyp': state.hyp,
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      className={cn('holo-fx', className)}
      style={cardVars}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className={cn('holo-fx__rotator', state.isActive ? 'active' : '')}>
        {children}
        <Shimmer isActive={state.isActive} />
        <Glare />
      </div>
    </div>
  );
};
