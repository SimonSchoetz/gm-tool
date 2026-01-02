import { ActionContainer } from '@/components';
import './AdventureBtn.css';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { FCProps, HtmlProps } from '@/types';
import { useRef } from 'react';
import { HoloFX, useTiltFX } from '@/components/HoloFX';

type Props = {
  onClick: (e?: any) => any;
  label: string;
  withHoloFX?: boolean;
} & HtmlProps<'div'>;

const AdventureBtn: FCProps<Props> = ({
  onClick,
  label,
  className,
  children,
  withHoloFX = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cardVars, isActive } = useTiltFX(containerRef);

  const HoloBtn = (
    <ActionContainer
      ref={containerRef}
      style={cardVars}
      className={cn('adventure-btn', 'tilt-fx-container')}
      onClick={onClick}
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
    </ActionContainer>
  );

  const NoHoloBtn = (
    <ActionContainer
      className={cn('adventure-btn')}
      onClick={onClick}
      aria-label={label}
    >
      <AdventureFrame className={cn('children-container', className)}>
        {children}
      </AdventureFrame>
    </ActionContainer>
  );

  return withHoloFX ? HoloBtn : NoHoloBtn;
};

export default AdventureBtn;
