import React from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../../ClickableIcon';
import './MentionPopupHeader.css';

type DraggableProps = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
};

type Props = {
  name: string;
  isPinned: boolean;
  draggableProps: DraggableProps;
  onPin: () => void;
  onRemove: () => void;
  onNavigate: () => void;
};

export const MentionPopupHeader: FCProps<Props> = ({
  name,
  isPinned,
  draggableProps,
  onPin,
  onRemove,
  onNavigate,
}) => (
  <div
    className={cn(
      'mention-popup-header',
      isPinned && 'mention-popup-header--pinned',
    )}
    {...(isPinned ? draggableProps : {})}
  >
    {' '}
    <div className='mention-popup-drag-name'>
      {isPinned && <>⠿</>} {name}
    </div>
    <div className='mention-popup-menu-bar'>
      <ClickableIcon
        icon={<ExternalLinkIcon />}
        onClick={onNavigate}
        label='Navigate to entity'
        title='Navigate'
      />
      {!isPinned ? (
        <ClickableIcon
          icon={<PinIcon />}
          onClick={onPin}
          label='Pin popup'
          title='Pin'
        />
      ) : (
        <ClickableIcon
          icon={<XIcon />}
          onClick={onRemove}
          label='Close popup'
          title='Close'
          variant='danger'
        />
      )}
    </div>
  </div>
);
