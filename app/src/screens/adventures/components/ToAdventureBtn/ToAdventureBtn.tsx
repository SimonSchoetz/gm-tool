import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';
import { cn } from '@/util';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import { FCProps, HtmlProps } from '@/types';
import { useRef } from 'react';
import { HoloFX, useTiltFX, Image } from '@/components';
import { Adventure } from '@db/adventure';
import { Routes } from '@/routes';

type Props = {
  adventure: Adventure;
} & HtmlProps<'div'>;

export const ToAdventureBtn: FCProps<Props> = ({ adventure, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cardVars, isActive } = useTiltFX(containerRef);
  const route = `${Routes.ADVENTURES}/${adventure.id}`;

  return (
    <Link
      to={route}
      className={cn('adventure-btn', 'action-card')}
      aria-label={adventure.title}
    >
      <div
        ref={containerRef}
        style={cardVars}
        className={cn('tilt-fx-container')}
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
            <HoloFX shimmerContent={adventure.title} />
          </div>
          {!adventure.image_id && adventure.title && (
            <p className='adventure-title'>{adventure.title}</p>
          )}
          <Image
            imageId={adventure.image_id}
            alt={`${adventure.title} preview`}
            className={cn('adventure-img', isActive && 'active')}
          />
        </AdventureFrame>
      </div>
    </Link>
  );
};
