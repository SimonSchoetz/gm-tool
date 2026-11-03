import { FCProps } from '@/types/fcProps.type';
import { useEncounterCombatantEntry } from '../../../../../../hooks/useEncounterCombatantEntry';
import { ScreensBaseEntityContentSectionPanel } from '../../../../../../../components/ScreensBaseEntityContentSectionPanel';
import { EncounterCombatantEntityDescription } from './components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription';
import { EncounterCombatantEntityImageUpload } from './components/EncounterCombatantEntityImageUpload/EncounterCombatantEntityImageUpload';
import './EncounterCombatantEntityView.css';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const entry = useEncounterCombatantEntry(shownItemId);
  const entity = entry?.entity ?? null;

  if (entity === null) return;

  return (
    <>
      <div className='encounter-combatant-entity-view'>
        <EncounterCombatantEntityImageUpload
          entityType={entity.entityType}
          entityId={entity.id}
        />
        <div className='encounter-combatant-entity-view-panel'>
          <ScreensBaseEntityContentSectionPanel baseEntityId={entity.id} />
        </div>
      </div>
      <EncounterCombatantEntityDescription
        entityType={entity.entityType}
        entityId={entity.id}
      />
    </>
  );
};
