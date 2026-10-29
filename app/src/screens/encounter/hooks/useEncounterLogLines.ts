import { useParams } from '@tanstack/react-router';
import {
  useAdventureBaseEntities,
  useEncounterLogEntries,
  useEncounterQueueItems,
} from '@/data-access-layer';
import { buildLogLines, type LogLine } from '../helper/buildLogLines';

export const useEncounterLogLines = (): {
  lines: LogLine[];
  loading: boolean;
} => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { queueItems, loading: queueLoading } =
    useEncounterQueueItems(encounterId);
  const { logEntries, loading: logLoading } =
    useEncounterLogEntries(encounterId);
  const { baseEntities, loading: entitiesLoading } =
    useAdventureBaseEntities(adventureId);

  const loading = queueLoading || logLoading || entitiesLoading;
  if (loading) return { lines: [], loading };

  return {
    lines: buildLogLines(queueItems, logEntries, baseEntities),
    loading,
  };
};
