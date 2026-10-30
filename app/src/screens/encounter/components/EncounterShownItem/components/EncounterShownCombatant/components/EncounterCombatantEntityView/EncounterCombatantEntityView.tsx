import { FCProps } from '@/types/fcProps.type';
import { useEncounterQueueEntry } from '../../../../../../hooks/useEncounterQueueEntry';
import { isCombatantEntry } from '../../../../../../helper/isCombatantEntry';
import { ScreensBaseEntityContentSectionPanel } from '../../../../../../../components/ScreensBaseEntityContentSectionPanel';
import { EncounterCombatantEntityDescription } from './components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const queueEntry = useEncounterQueueEntry(shownItemId);
  const entry = isCombatantEntry(queueEntry) ? queueEntry : null;
  const entity = entry?.entity ?? null;

  if (entity === null) return;

  return (
    <>
      <ScreensBaseEntityContentSectionPanel baseEntityId={entity.id} />
      <EncounterCombatantEntityDescription
        entityType={entity.entityType}
        entityId={entity.id}
      />
    </>
  );
};
