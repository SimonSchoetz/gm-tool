import { entityTypeLabel, type EntityType } from '@domain';
import { FCProps } from '@/types';
import {
  NpcDuplicateBtn,
  PcDuplicateBtn,
  FoeDuplicateBtn,
  FactionDuplicateBtn,
  LocationDuplicateBtn,
  ItemDuplicateBtn,
  SessionDuplicateBtn,
  EncounterDuplicateBtn,
} from './components';

type Props = { entityType: EntityType };

// This switch is the single declaration of what can be duplicated, which is why the component can be placed in every item sidebar unconditionally.
export const ScreensDuplicateBtn: FCProps<Props> = ({ entityType }) => {
  const label = `Duplicate ${entityTypeLabel(entityType)}`;

  switch (entityType) {
    case 'npcs':
      return <NpcDuplicateBtn label={label} />;
    case 'pcs':
      return <PcDuplicateBtn label={label} />;
    case 'foes':
      return <FoeDuplicateBtn label={label} />;
    case 'factions':
      return <FactionDuplicateBtn label={label} />;
    case 'locations':
      return <LocationDuplicateBtn label={label} />;
    case 'items':
      return <ItemDuplicateBtn label={label} />;
    case 'sessions':
      return <SessionDuplicateBtn label={label} />;
    case 'encounters':
      return <EncounterDuplicateBtn label={label} />;
    // Adventures own seven child tables; their duplication is out of scope. This case becomes a component when that ships.
    case 'adventures':
      return null;
  }
};
