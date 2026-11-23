import { useParams } from '@tanstack/react-router';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { useEncounterLogEntries } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { isCombatantEntry } from '../../../../helper/isCombatantEntry';
import { isEventEntry } from '../../../../helper/isEventEntry';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import { EncounterCombatantActionRow } from './components/EncounterCombatantActionRow/EncounterCombatantActionRow';
import { buildPlanRows } from './helper/buildPlanRows';
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
  const { openDeleteDialog } = useDeleteDialog();
  const selectedEntries = entries.filter((entry) =>
    selectedIds.includes(entry.id),
  );
  const combatantEntries = selectedEntries.filter(isCombatantEntry);
  const eventEntries = selectedEntries.filter(isEventEntry);
  // Held in this component, which stays mounted, and not beside the amount fields, which unmount whenever the selection is empty: the amounts survive an action and a selection that passes through empty. The amounts see the selected combatants only: an event never receives an amount.
  const { sharedText, amountTextOf, setSharedText, setRowText } =
    useActionAmounts(combatantEntries.map((entry) => entry.id));

  if (selectedEntries.length === 0) {
    return (
      <div className='encounter-combatant-actions-tab'>
        Select a combatant in the queue.
      </div>
    );
  }

  const rows = combatantEntries.map((entry) => ({
    entry,
    hp: describeQueueEntryHp(entry),
  }));
  const planRows = buildPlanRows(selectedEntries, amountTextOf);
  const recordPlan = (plan: GroupActionPlan | null) => {
    // Every button is disabled while its plan is null, so a click never reaches this guard.
    if (plan === null) return;
    void recordLogEntry(plan.kind, plan.payload);
  };

  const recordButton = (label: string, plan: GroupActionPlan | null) => ({
    label,
    plan,
    onClick: () => {
      recordPlan(plan);
    },
  });

  const removePlan = planGroupAction('removed', planRows);
  // A removal cannot be reverted, so it waits for a confirm; the selection is left as it is whether the dialog is confirmed or closed.
  const onRemove = () => {
    openDeleteDialog({
      action: 'remove',
      oneClickConfirm: true,
      name: selectedEntries.map((entry) => entry.name).join(', '),
      onDeletionConfirm: () => {
        recordPlan(removePlan);
      },
    });
  };

  const amountButtons = [
    recordButton('Damage', planGroupAction('damage', planRows)),
    recordButton('Heal', planGroupAction('heal', planRows)),
    recordButton('Set temp HP', planGroupAction('temp-hp', planRows)),
    recordButton('Set max HP', planGroupAction('max-hp', planRows)),
  ];
  const stateButtons = [
    recordButton('Mark defeated', planGroupAction('defeated', planRows)),
    recordButton('Unmark defeated', planGroupAction('undefeated', planRows)),
    {
      label: 'Remove',
      plan: removePlan,
      onClick: onRemove,
      buttonStyle: 'danger' as const,
    },
  ];

  const onSharedAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSharedText(event.currentTarget.value);
  };

  return (
    <div className='encounter-combatant-actions-tab'>
      {combatantEntries.length > 1 && (
        <Input
          className='number-input'
          type='number'
          min={0}
          aria-label='Shared amount'
          placeholder='Amount for all'
          value={sharedText}
          onChange={onSharedAmountChange}
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
            />
          ))}
        </div>
      ))}

      <div className='encounter-combatant-actions-tab-rows scroll-edge-fade scroll-edge-fade--sm scroll-edge-fade--no-top'>
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

      {eventEntries.length > 0 && (
        <p className='encounter-combatant-actions-tab-events-note'>
          Remove also removes:{' '}
          {eventEntries.map((entry) => entry.name).join(', ')}
        </p>
      )}
    </div>
  );
};
