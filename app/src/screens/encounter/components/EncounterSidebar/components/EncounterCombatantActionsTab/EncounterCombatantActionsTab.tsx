import { useParams } from '@tanstack/react-router';
import { parseActionAmount } from '@domain';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterLogEntries } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import { EncounterCombatantActionRow } from './components/EncounterCombatantActionRow/EncounterCombatantActionRow';
import { planGroupAction } from './helper/planGroupAction';
import type { GroupActionPlan } from './helper/planGroupAction';
import { useActionAmounts } from './hooks/useActionAmounts';
import './EncounterCombatantActionsTab.css';

type Props = { selectedIds: string[] };

export const EncounterCombatantActionsTab: FCProps<Props> = ({
  selectedIds,
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { entries } = useEncounterQueueEntries();
  const { recordLogEntry, isWriting } = useEncounterLogEntries(encounterId);
  // Held in this component, which stays mounted, and not beside the amount fields, which unmount whenever the selection is empty: the amounts survive an action and a selection that passes through empty.
  const { sharedText, amountTextOf, setSharedText, setRowText } =
    useActionAmounts(selectedIds);
  const selectedEntries = entries.filter((entry) =>
    selectedIds.includes(entry.id),
  );

  if (selectedEntries.length === 0) {
    return (
      <div className='encounter-combatant-actions-tab'>
        Select a combatant in the queue.
      </div>
    );
  }

  const planRows = selectedEntries.map((entry) => ({
    id: entry.id,
    amount: parseActionAmount(amountTextOf(entry.id)),
    hasHp: describeQueueEntryHp(entry) !== null,
    defeated: entry.defeated,
  }));
  const damagePlan = planGroupAction('damage', planRows);
  const healPlan = planGroupAction('heal', planRows);
  const tempHpPlan = planGroupAction('temp-hp', planRows);
  const maxHpPlan = planGroupAction('max-hp', planRows);
  const defeatedPlan = planGroupAction('defeated', planRows);
  const undefeatedPlan = planGroupAction('undefeated', planRows);
  const removedPlan = planGroupAction('removed', planRows);

  const recordPlan = (plan: GroupActionPlan | null) => {
    // Stryker disable next-line ConditionalExpression: every button is disabled while its plan is null, so a click never reaches this guard
    if (plan === null) return;
    void recordLogEntry(plan.kind, plan.payload);
  };

  return (
    <div className='encounter-combatant-actions-tab'>
      {selectedEntries.length > 1 && (
        <Input
          className='number-input'
          type='number'
          min={0}
          aria-label='Shared amount'
          placeholder='Amount for all'
          value={sharedText}
          onChange={(event) => {
            setSharedText(event.currentTarget.value);
          }}
        />
      )}

      <div className='encounter-combatant-actions-tab-buttons'>
        <Button
          label='Damage'
          disabled={isWriting || damagePlan === null}
          onClick={() => {
            recordPlan(damagePlan);
          }}
        />
        <Button
          label='Heal'
          disabled={isWriting || healPlan === null}
          onClick={() => {
            recordPlan(healPlan);
          }}
        />
        <Button
          label='Set temp HP'
          disabled={isWriting || tempHpPlan === null}
          onClick={() => {
            recordPlan(tempHpPlan);
          }}
        />
        <Button
          label='Set max HP'
          disabled={isWriting || maxHpPlan === null}
          onClick={() => {
            recordPlan(maxHpPlan);
          }}
        />
      </div>

      <div className='encounter-combatant-actions-tab-buttons'>
        <Button
          label='Mark defeated'
          disabled={isWriting || defeatedPlan === null}
          onClick={() => {
            recordPlan(defeatedPlan);
          }}
        />
        <Button
          label='Unmark defeated'
          disabled={isWriting || undefeatedPlan === null}
          onClick={() => {
            recordPlan(undefeatedPlan);
          }}
        />
        <Button
          label='Remove'
          buttonStyle='danger'
          // Stryker disable next-line ConditionalExpression: the buttons render only for a non-empty selection, so removedPlan is never null here and no input observes a difference
          disabled={isWriting || removedPlan === null}
          onClick={() => {
            recordPlan(removedPlan);
          }}
        />
      </div>

      <div className='encounter-combatant-actions-tab-rows'>
        {selectedEntries.map((entry) => {
          const hp = describeQueueEntryHp(entry);
          return (
            <EncounterCombatantActionRow
              key={entry.id}
              name={entry.name}
              hpText={hp ? hp.text : 'HP is not set. Set max HP to track it.'}
              amountText={amountTextOf(entry.id)}
              onAmountChange={(text) => {
                setRowText(entry.id, text);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
