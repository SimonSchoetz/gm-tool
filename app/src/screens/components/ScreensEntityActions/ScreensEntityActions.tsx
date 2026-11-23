import type { EntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { BaseEntityActionRows } from './components/BaseEntityActionRows/BaseEntityActionRows';
import { SessionActionRows } from './components/SessionActionRows/SessionActionRows';
import { EncounterActionRows } from './components/EncounterActionRows/EncounterActionRows';
import type { AfterDelete } from './components/EntityActionRows/EntityActionRows';

type Props = {
  entityType: EntityType;
  entityId: string;
  adventureId: string;
  afterDelete: AfterDelete;
  onChoose: () => void;
};

// This switch is the single declaration of which entity types have actions to show, which is why the component can be placed in every action menu unconditionally.
export const ScreensEntityActions: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
  afterDelete,
  onChoose,
}) => {
  switch (entityType) {
    case 'npcs':
    case 'pcs':
    case 'foes':
    case 'factions':
    case 'locations':
    case 'items':
      return (
        <BaseEntityActionRows
          entityType={entityType}
          entityId={entityId}
          adventureId={adventureId}
          afterDelete={afterDelete}
          onChoose={onChoose}
        />
      );
    case 'sessions':
      return (
        <SessionActionRows
          entityId={entityId}
          adventureId={adventureId}
          afterDelete={afterDelete}
          onChoose={onChoose}
        />
      );
    case 'encounters':
      return (
        <EncounterActionRows
          entityId={entityId}
          adventureId={adventureId}
          afterDelete={afterDelete}
          onChoose={onChoose}
        />
      );
    // Adventures own seven child tables; their duplication is out of scope. This case becomes a component when its Delete action ships.
    case 'adventures':
      return null;
  }
};
