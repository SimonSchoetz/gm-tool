import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { FCProps, HtmlProps } from '@/types';
import { useRef } from 'react';
import { HoloFX, useTiltFX } from '@/components/HoloFX';

type Props = {
  to: string;
  label: string;
} & HtmlProps<'div'>;

export const ToAdventureBtn: FCProps<Props> = ({
  to,
  label,
  className,
  children,
}) => {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const { cardVars, isActive } = useTiltFX(containerRef);

  return (
    <Link
      to={to}
      ref={containerRef}
      style={cardVars}
      className={cn('adventure-btn', 'tilt-fx-container', 'action-card')}
      aria-label={label}
    >
      <AdventureFrame
        className={cn(
          'children-container',
          'tilt-fx',
          isActive && 'active',
          className
        )}
      >
        <div className={cn('holo-fx-container', isActive && 'active')}>
          <HoloFX shimmerContent={label} />
        </div>
        {children}
      </AdventureFrame>
    </Link>
  );
};
