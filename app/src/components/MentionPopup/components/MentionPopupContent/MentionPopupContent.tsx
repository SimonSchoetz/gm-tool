import { FCProps } from '@/types';
import { NpcPopupContent } from './components';
import './MentionPopupContent.css';

type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
};

export const MentionPopupContent: FCProps<Props> = ({
  entityId,
  entityType,
  adventureId,
}) => {
  switch (entityType) {
    case 'npcs':
      return <NpcPopupContent entityId={entityId} adventureId={adventureId} />;
    default:
      return null;
  }
};
