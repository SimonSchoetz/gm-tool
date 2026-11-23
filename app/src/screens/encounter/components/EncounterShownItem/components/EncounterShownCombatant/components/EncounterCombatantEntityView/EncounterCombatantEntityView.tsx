import { useNavigate, useParams } from '@tanstack/react-router';
import { EntityReadOnlyView } from '@/components/EntityReadOnlyView/EntityReadOnlyView';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { FCProps } from '@/types/fcProps.type';
import { buildEntityPath } from '@domain';
import { useEncounterCombatantEntry } from '../../../../../../hooks/useEncounterCombatantEntry';
import { EncounterCombatantEntityHeader } from './components/EncounterCombatantEntityHeader/EncounterCombatantEntityHeader';
import { EncounterCombatantEntityNavigationContext } from './EncounterCombatantEntityNavigationContext';
import './EncounterCombatantEntityView.css';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const navigate = useNavigate();
  const entry = useEncounterCombatantEntry(shownItemId);
  const entity = entry?.entity ?? null;

  if (entity === null) return;

  const onNavigate = () => {
    void navigate({
      to: buildEntityPath(entity.entityType, entity.id, adventureId),
    });
  };

  return (
    <GlassPanel intensity='bright' className='encounter-combatant-entity-view'>
      <EncounterCombatantEntityNavigationContext.Provider value={onNavigate}>
        <EntityReadOnlyView
          entityType={entity.entityType}
          entityId={entity.id}
          adventureId={adventureId}
          Header={EncounterCombatantEntityHeader}
          navZIndex={null}
        />
      </EncounterCombatantEntityNavigationContext.Provider>
    </GlassPanel>
  );
};
