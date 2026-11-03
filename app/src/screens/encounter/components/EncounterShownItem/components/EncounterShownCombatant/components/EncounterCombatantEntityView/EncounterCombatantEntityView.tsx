import { useParams } from '@tanstack/react-router';
import { EntityReadOnlyView } from '@/components/EntityReadOnlyView/EntityReadOnlyView';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { FCProps } from '@/types/fcProps.type';
import { useEncounterCombatantEntry } from '../../../../../../hooks/useEncounterCombatantEntry';
import { EncounterCombatantEntityHeader } from './components/EncounterCombatantEntityHeader/EncounterCombatantEntityHeader';
import './EncounterCombatantEntityView.css';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const entry = useEncounterCombatantEntry(shownItemId);
  const entity = entry?.entity ?? null;

  if (entity === null) return;

  return (
    <GlassPanel intensity='bright' className='encounter-combatant-entity-view'>
      <EntityReadOnlyView
        entityType={entity.entityType}
        entityId={entity.id}
        adventureId={adventureId}
        Header={EncounterCombatantEntityHeader}
        navZIndex={null}
      />
    </GlassPanel>
  );
};
