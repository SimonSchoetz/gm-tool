import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../../ClickableIcon/ClickableIcon';
import { PanelMenuBar } from '../../../PanelMenuBar/PanelMenuBar';
import { useMentionPopupHeader } from '../../hooks/useMentionPopupHeader';
import './MentionPopupHeader.css';

type Props = {
  leading?: ReactNode;
  titleSuffix?: string;
};

export const MentionPopupHeader: FCProps<Props> = ({
  leading = null,
  titleSuffix,
}) => {
  const header = useMentionPopupHeader();

  return (
    <PanelMenuBar
      leading={leading}
      title={
        <>
          {header.isPinned && leading === null && <>⠿</>} {header.name}
          {titleSuffix}
        </>
      }
      titleProps={{
        ...(header.isPinned ? header.draggableProps : {}),
        className: cn(header.isPinned && 'mention-popup-name--pinned'),
      }}
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
