import { FCProps } from '@/types/fcProps.type';
import { useEncounterQueueEntry } from '../../../../hooks/useEncounterQueueEntry';
import { ScreensBaseEntityContentSectionPanel } from '../../../../../components/ScreensBaseEntityContentSectionPanel';
import { EncounterCombatantEntityDescription } from './components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const entity = useEncounterQueueEntry(shownItemId)?.entity ?? null;

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
