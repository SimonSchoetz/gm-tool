import { entityTypeLabel, type EntityType } from '@domain';
import { FCProps } from '@/types';
import {
  BaseEntityDuplicateBtn,
  SessionDuplicateBtn,
  EncounterDuplicateBtn,
} from './components';

type Props = { entityType: EntityType };

// This switch is the single declaration of what can be duplicated, which is why the component can be placed in every item sidebar unconditionally.
export const ScreensDuplicateBtn: FCProps<Props> = ({ entityType }) => {
  const label = `Duplicate ${entityTypeLabel(entityType)}`;

  switch (entityType) {
    case 'npcs':
    case 'pcs':
    case 'foes':
    case 'factions':
    case 'locations':
    case 'items':
      return <BaseEntityDuplicateBtn entityType={entityType} label={label} />;
    case 'sessions':
      return <SessionDuplicateBtn label={label} />;
    case 'encounters':
      return <EncounterDuplicateBtn label={label} />;
    // Adventures own seven child tables; their duplication is out of scope. This case becomes a component when that ships.
    case 'adventures':
      return null;
  }
};
