import { FCProps, HtmlProps } from '@/types';
import { PropsWithChildren, useRef } from 'react';
import './HoloFX.css';
import { cn } from '@/util';
import { Glare, Shimmer } from './components';
import { useHoloMovement } from './hooks/useHoloMovement';

type Props = PropsWithChildren<HtmlProps<'div'>>;

export const HoloFX: FCProps<Props> = ({ className, children, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cardVars, isActive } = useHoloMovement(containerRef);

  return (
    <div
      ref={containerRef}
      className={cn('holo-fx', className)}
      style={cardVars}
      {...props}
    >
      <div className={cn('holo-fx__rotator', isActive ? 'active' : '')}>
        {children}
        <Shimmer />
        <Glare />
      </div>
    </div>
  );
};
