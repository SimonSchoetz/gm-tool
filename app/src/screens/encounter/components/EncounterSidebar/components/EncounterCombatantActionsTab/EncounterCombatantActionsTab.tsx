import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { parseActionAmount } from '@domain';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterLogEntries } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import { getActionAvailability } from './helper/getActionAvailability';
import './EncounterCombatantActionsTab.css';

type Props = { selectedId: string | null };

export const EncounterCombatantActionsTab: FCProps<Props> = ({
  selectedId,
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { entries } = useEncounterQueueEntries();
  const { recordLogEntry, isRecording } = useEncounterLogEntries(encounterId);
  // Held in this component, which stays mounted, and not beside the amount field, which unmounts whenever the selection is empty: the amount survives an action and a selection that passes through empty.
  // Stryker disable next-line StringLiteral: a number input reads any non-numeric text as empty, so a changed initial text shows the same field and parses to no amount
  const [amountText, setAmountText] = useState('');
  const entry =
    entries.find((candidate) => candidate.id === selectedId) ?? null;

  if (!entry) {
    return (
      <div className='encounter-combatant-actions-tab'>
        Select a combatant in the queue.
      </div>
    );
  }

  const hp = describeQueueEntryHp(entry);
  const amount = parseActionAmount(amountText);
  const available = getActionAvailability({
    amount,
    hasHp: hp !== null,
    defeated: entry.defeated,
    isRecording,
  });

  const recordAmount = (kind: 'damage' | 'heal') => {
    // Stryker disable next-line ConditionalExpression: the four amount buttons are disabled while the amount is null, so a click never reaches this guard
    if (amount === null) return;
    void recordLogEntry(kind, {
      targets: [{ queueItemId: entry.id, amount }],
    });
  };

  const recordValue = (kind: 'temp-hp' | 'max-hp') => {
    // Stryker disable next-line ConditionalExpression: the four amount buttons are disabled while the amount is null, so a click never reaches this guard
    if (amount === null) return;
    void recordLogEntry(kind, {
      targets: [{ queueItemId: entry.id, value: amount }],
    });
  };

  const recordState = (kind: 'defeated' | 'undefeated' | 'removed') => {
    void recordLogEntry(kind, { queueItemIds: [entry.id] });
  };

  return (
    <div className='encounter-combatant-actions-tab'>
      <div className='encounter-combatant-actions-tab-row'>
        <div className='encounter-combatant-actions-tab-text'>
          <div className='clip-text'>{entry.name}</div>
          <div className='encounter-combatant-actions-tab-hp'>
            {hp ? hp.text : 'HP is not set. Set max HP to track it.'}
          </div>
        </div>

        <Input
          className='encounter-combatant-actions-tab-amount number-input'
          type='number'
          min={0}
          aria-label='Amount'
          placeholder='Amount'
          value={amountText}
          onChange={(event) => {
            setAmountText(event.currentTarget.value);
          }}
        />
      </div>

      <div className='encounter-combatant-actions-tab-buttons'>
        <Button
          label='Damage'
          disabled={!available.damage}
          onClick={() => {
            recordAmount('damage');
          }}
        />
        <Button
          label='Heal'
          disabled={!available.heal}
          onClick={() => {
            recordAmount('heal');
          }}
        />
        <Button
          label='Set temp HP'
          disabled={!available.setTempHp}
          onClick={() => {
            recordValue('temp-hp');
          }}
        />
        <Button
          label='Set max HP'
          disabled={!available.setMaxHp}
          onClick={() => {
            recordValue('max-hp');
          }}
        />
      </div>

      <div className='encounter-combatant-actions-tab-buttons'>
        <Button
          label='Mark defeated'
          disabled={!available.markDefeated}
          onClick={() => {
            recordState('defeated');
          }}
        />
        <Button
          label='Unmark defeated'
          disabled={!available.unmarkDefeated}
          onClick={() => {
            recordState('undefeated');
          }}
        />
        <Button
          label='Remove'
          buttonStyle='danger'
          disabled={!available.remove}
          onClick={() => {
            recordState('removed');
          }}
        />
      </div>
    </div>
  );
};
