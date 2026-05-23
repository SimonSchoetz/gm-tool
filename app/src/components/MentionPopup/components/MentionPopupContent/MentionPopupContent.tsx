import { FCProps } from '@/types';
import {
  NpcPopupContent,
  FoePopupContent,
  PcPopupContent,
  FactionPopupContent,
  LocationPopupContent,
  ItemPopupContent,
} from './components';
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
    case 'foes':
      return <FoePopupContent entityId={entityId} adventureId={adventureId} />;
    case 'pcs':
      return <PcPopupContent entityId={entityId} adventureId={adventureId} />;
    case 'factions':
      return (
        <FactionPopupContent entityId={entityId} adventureId={adventureId} />
      );
    case 'locations':
      return (
        <LocationPopupContent entityId={entityId} adventureId={adventureId} />
      );
    case 'items':
      return <ItemPopupContent entityId={entityId} adventureId={adventureId} />;
    default:
      return null;
  }
};
