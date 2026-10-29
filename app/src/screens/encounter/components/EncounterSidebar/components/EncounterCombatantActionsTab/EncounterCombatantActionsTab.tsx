import { useParams } from '@tanstack/react-router';
import { parseActionAmount } from '@domain';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterLogEntries } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import { EncounterCombatantActionRow } from './components/EncounterCombatantActionRow/EncounterCombatantActionRow';
import { describeActionRowHp } from './helper/describeActionRowHp';
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

  const rows = selectedEntries.map((entry) => ({
    entry,
    hp: describeQueueEntryHp(entry),
  }));
  const planRows = rows.map(({ entry, hp }) => ({
    id: entry.id,
    amount: parseActionAmount(amountTextOf(entry.id)),
    hasHp: hp !== null,
    defeated: entry.defeated,
  }));
  const amountButtons = [
    { label: 'Damage', plan: planGroupAction('damage', planRows) },
    { label: 'Heal', plan: planGroupAction('heal', planRows) },
    { label: 'Set temp HP', plan: planGroupAction('temp-hp', planRows) },
    { label: 'Set max HP', plan: planGroupAction('max-hp', planRows) },
  ];
  const stateButtons = [
    {
      label: 'Mark defeated',
      plan: planGroupAction('defeated', planRows),
    },
    {
      label: 'Unmark defeated',
      plan: planGroupAction('undefeated', planRows),
    },
    {
      label: 'Remove',
      plan: planGroupAction('removed', planRows),
      buttonStyle: 'danger' as const,
    },
  ];

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

      {[amountButtons, stateButtons].map((group) => (
        <div
          key={group[0].label}
          className='encounter-combatant-actions-tab-buttons'
        >
          {group.map(({ label, plan, ...rest }) => (
            <Button
              key={label}
              label={label}
              {...rest}
              disabled={isWriting || plan === null}
              onClick={() => {
                recordPlan(plan);
              }}
            />
          ))}
        </div>
      ))}

      <div className='encounter-combatant-actions-tab-rows'>
        {rows.map(({ entry, hp }) => (
          <EncounterCombatantActionRow
            key={entry.id}
            name={entry.name}
            hpText={describeActionRowHp(hp)}
            amountText={amountTextOf(entry.id)}
            onAmountChange={(text) => {
              setRowText(entry.id, text);
            }}
          />
        ))}
      </div>
    </div>
  );
};
