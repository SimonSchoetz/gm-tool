import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { SlideDirection } from '@/types/slideDirection.type';
import { cn } from '@/util/className';
import './SlideTransition.css';

type Props = {
  slide: { direction: SlideDirection; outgoing: ReactNode } | null;
  onEnd: () => void;
  className?: string;
  children: ReactNode;
};

export const SlideTransition: FCProps<Props> = ({
  slide,
  onEnd,
  className,
  children,
}) => {
  return (
    <div className={cn('slide-transition', className)}>
      <div
        className={cn(
          'slide-transition-incoming',
          slide && `slide-transition-incoming--${slide.direction}`,
        )}
        onAnimationEnd={(event) => {
          // The target === currentTarget check keeps an animation inside the children from ending the slide early, which would remove the outgoing content mid-animation.
          if (event.target === event.currentTarget) onEnd();
        }}
      >
        {children}
      </div>
      {slide && (
        <div
          inert
          className={`slide-transition-outgoing slide-transition-outgoing--${slide.direction}`}
        >
          {slide.outgoing}
        </div>
      )}
    </div>
  );
};
