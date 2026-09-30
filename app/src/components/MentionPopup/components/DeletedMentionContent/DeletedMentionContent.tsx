import { FCProps } from '@/types/fcProps.type';
import { entityTypeLabel } from '@domain';
import './DeletedMentionContent.css';

type Props = {
  entityType: string;
};

export const DeletedMentionContent: FCProps<Props> = ({ entityType }) => (
  <div className='deleted-mention-content'>
    Deleted {entityTypeLabel(entityType)}
  </div>
);
