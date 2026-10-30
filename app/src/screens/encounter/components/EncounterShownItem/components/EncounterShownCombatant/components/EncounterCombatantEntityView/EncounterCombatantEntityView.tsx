import { FCProps } from '@/types/fcProps.type';
import { useEncounterCombatantEntry } from '../../../../../../hooks/useEncounterCombatantEntry';
import { ScreensBaseEntityContentSectionPanel } from '../../../../../../../components/ScreensBaseEntityContentSectionPanel';
import { EncounterCombatantEntityDescription } from './components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription';

type Props = { shownItemId: string };

export const EncounterCombatantEntityView: FCProps<Props> = ({
  shownItemId,
}) => {
  const entry = useEncounterCombatantEntry(shownItemId);
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
