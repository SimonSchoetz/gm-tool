import { FCProps } from '@/types';
import type { MentionEntityType } from '@domain/mentions';
import { isBaseEntityType, type BaseEntityType } from '@domain/entities';
import {
  BaseEntityPopupContent,
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

// Keyed by the non-base mentionable types (domain/mentions/mentionEntityType.ts minus domain/entities/entityTypes.ts's base types) so a non-base mentionable entity added there and not here fails to compile. Base entity types dispatch through isBaseEntityType above.
const popupContentMap: Record<
  Exclude<MentionEntityType, BaseEntityType>,
  FCProps<PopupContentProps>
> = {
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
  if (isBaseEntityType(entityType))
    return (
      <BaseEntityPopupContent
        entityType={entityType}
        entityId={entityId}
        adventureId={adventureId}
      />
    );

  const PopupContent = popupContentByType[entityType];
  if (!PopupContent) return;

  return <PopupContent entityId={entityId} adventureId={adventureId} />;
};
