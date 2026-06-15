import React from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../../ClickableIcon/ClickableIcon';
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
  <div className='mention-popup-header'>
    <div
      {...(isPinned ? draggableProps : {})}
      className={cn(
        'mention-popup-name',
        isPinned && 'mention-popup-name--pinned',
      )}
    >
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
