import { FCProps, HtmlProps } from '@/types';
import { CSSProperties, useRef } from 'react';
import { HoloFX, useTiltFX } from '../HoloFX';
import { cn } from '@/util';

import { ImageById } from '../ImageById/ImageById';
import './HoloImg.css';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';

type Props = {
  image_id: string;
  title: string;
  dimensions?: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
} & HtmlProps<'div'>;

export const HoloImg: FCProps<Props> = ({
  image_id,
  title,
  className,
  dimensions,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cardVars, isActive } = useTiltFX(containerRef);
  return (
    <div
      ref={containerRef}
      style={cardVars}
      className={cn('tilt-fx-container')}
      {...props}
    >
      <ImagePlaceholderFrame
        dimensions={dimensions}
        className={cn('tilt-fx', isActive && 'active', className)}
      >
        <HoloFX shimmerContent={title} isActive={isActive} />

        {!image_id && title && <p className='holo-img-title'>{title}</p>}
        <ImageById
          imageId={image_id}
          alt={`${title} preview`}
          className={cn('holo-img', isActive && 'active')}
        />
      </ImagePlaceholderFrame>
    </div>
  );
};
