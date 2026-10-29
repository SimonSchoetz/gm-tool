import { useParams } from '@tanstack/react-router';
import {
  useAdventureBaseEntities,
  useEncounter,
  useEncounterLogEntries,
  useEncounterQueueItems,
} from '@/data-access-layer';
import { buildQueueEntries } from '../helper/buildQueueEntries';

export const useEncounterQueueEntries = (): {
  entries: ReturnType<typeof buildQueueEntries>;
  loading: boolean;
} => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, loading: encounterLoading } = useEncounter(
    encounterId,
    adventureId,
  );
  const { queueItems, loading: queueLoading } =
    useEncounterQueueItems(encounterId);
  const { logEntries, loading: logLoading } =
    useEncounterLogEntries(encounterId);
  const { baseEntities, loading: entitiesLoading } =
    useAdventureBaseEntities(adventureId);

  const loading =
    encounterLoading || queueLoading || logLoading || entitiesLoading;
  if (loading) return { entries: [], loading };

  return {
    entries: buildQueueEntries(
      queueItems,
      logEntries,
      baseEntities,
      // Stryker disable next-line OptionalChaining: every read has loaded when this runs and a loaded encounter is never null, so no input observes a difference
      encounter?.hide_defeated === 1,
    ),
    loading,
  };
};
