import { FCProps, HtmlProps } from '@/types';
import {
  PropsWithChildren,
  useRef,
  useState,
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
  const containerRef = useRef<HTMLDivElement>(null);
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
      ref={containerRef}
      className={cn('holo-fx', className)}
      style={cardVars}
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
