import { useBaseEntityContentSections } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { useEncounterQueueEntry } from '../../../../hooks/useEncounterQueueEntry';
import { describeHpNotSetHint } from './helper/describeHpNotSetHint';
import './EncounterCombatantHp.css';

type Props = { shownItemId: string };

export const EncounterCombatantHp: FCProps<Props> = ({ shownItemId }) => {
  const queueEntry = useEncounterQueueEntry(shownItemId);
  const entry = queueEntry?.kind === 'combatant' ? queueEntry : null;
  // The query is disabled for an empty id, so no read happens without a linked entity.
  const { sections, loading } = useBaseEntityContentSections(
    entry?.entity?.id ?? '',
  );

  if (entry === null) return;

  const hp = describeQueueEntryHp(entry);

  return (
    <p className='encounter-combatant-hp'>
      {hp
        ? hp.text
        : describeHpNotSetHint({
            entityLinked: entry.entity !== null,
            sectionsLoading: loading,
            sections,
          })}
      {entry.defeated && (
        <span className='encounter-combatant-hp-defeated'>Defeated</span>
      )}
    </p>
  );
};
