import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../../ClickableIcon/ClickableIcon';
import { PanelMenuBar } from '../../../PanelMenuBar/PanelMenuBar';
import { useMentionPopupHeader } from '../../hooks/useMentionPopupHeader';
import './MentionPopupHeader.css';

type Props = {
  controls?: ReactNode;
  sectionName?: string;
};

export const MentionPopupHeader: FCProps<Props> = ({
  controls = null,
  sectionName,
}) => {
  const header = useMentionPopupHeader();

  return (
    <PanelMenuBar
      title={
        <div className='mention-popup-header-title'>
          <span
            {...(header.isPinned ? header.draggableProps : {})}
            className={cn(header.isPinned && 'mention-popup-name--pinned')}
          >
            {header.isPinned && controls === null && <>⠿ </>}
            {header.name}
          </span>
          {controls !== null && (
            <div className='mention-popup-header-controls'>{controls}</div>
          )}
          {sectionName !== undefined && (
            <span className='label'>{sectionName}</span>
          )}
        </div>
      }
    >
      <ClickableIcon
        icon={<ExternalLinkIcon />}
        onClick={header.onNavigate}
        label='Navigate to entity'
        title='Navigate'
      />
      {!header.isPinned ? (
        <ClickableIcon
          icon={<PinIcon />}
          onClick={header.onPin}
          label='Pin popup'
          title='Pin'
        />
      ) : (
        <ClickableIcon
          icon={<XIcon />}
          onClick={header.onRemove}
          label='Close popup'
          title='Close'
          variant='danger'
        />
      )}
    </PanelMenuBar>
  );
};
