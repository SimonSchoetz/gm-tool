import { FCProps } from '@/types';
import type { MentionEntityType } from '@domain/mentions';
import {
  NpcPopupContent,
  FoePopupContent,
  PcPopupContent,
  FactionPopupContent,
  LocationPopupContent,
  ItemPopupContent,
  SessionPopupContent,
  EncounterPopupContent,
} from './components';

type Props = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
};

type PopupContentProps = {
  entityId: string;
  adventureId: string | null;
};

// keyed against MentionEntityType (domain/mentions/mentionEntityType.ts) so a mentionable entity added there and not here fails to compile
const popupContentMap: Record<MentionEntityType, FCProps<PopupContentProps>> = {
  npcs: NpcPopupContent,
  foes: FoePopupContent,
  pcs: PcPopupContent,
  factions: FactionPopupContent,
  locations: LocationPopupContent,
  items: ItemPopupContent,
  sessions: SessionPopupContent,
  encounters: EncounterPopupContent,
};

const popupContentByType: Record<
  string,
  FCProps<PopupContentProps> | undefined
> = popupContentMap;

export const MentionPopupContent: FCProps<Props> = ({
  entityId,
  entityType,
  adventureId,
}) => {
  const PopupContent = popupContentByType[entityType];
  if (!PopupContent) return;

  return <PopupContent entityId={entityId} adventureId={adventureId} />;
};
