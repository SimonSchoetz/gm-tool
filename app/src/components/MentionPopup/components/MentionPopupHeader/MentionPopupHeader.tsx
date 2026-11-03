import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { PinIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { ClickableIcon } from '../../../ClickableIcon/ClickableIcon';
import { EntitySectionHeaderLeading } from '../../../EntitySectionHeaderLeading/EntitySectionHeaderLeading';
import { PanelMenuBar } from '../../../PanelMenuBar/PanelMenuBar';
import { useMentionPopupHeader } from '../../hooks/useMentionPopupHeader';
import './MentionPopupHeader.css';

type Props = React.ComponentProps<typeof EntitySectionHeaderLeading>;

export const MentionPopupHeader: FCProps<Props> = (leadingProps) => {
  const header = useMentionPopupHeader();

  return (
    <PanelMenuBar
      leading={<EntitySectionHeaderLeading {...leadingProps} />}
      title={
        <span
          {...(header.isPinned ? header.draggableProps : {})}
          className={cn(
            'clip-text',
            'MPH-title',
            header.isPinned && 'MPH-title--pinned',
          )}
        >
          {header.isPinned && <>⠿ </>}
          {header.name}
        </span>
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
