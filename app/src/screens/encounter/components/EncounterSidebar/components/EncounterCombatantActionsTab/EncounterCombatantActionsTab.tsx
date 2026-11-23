import { useParams } from '@tanstack/react-router';
import { Input } from '@/components/Input/Input';
import { useEncounterLogEntries } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { isCombatantEntry } from '../../../../helper/isCombatantEntry';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import { EncounterCombatantActionButton } from './components/EncounterCombatantActionButton/EncounterCombatantActionButton';
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
  const { recordLogEntry } = useEncounterLogEntries(encounterId);
  const { openDeleteDialog } = useDeleteDialog();
  const selectedEntries = entries.filter((entry) =>
    selectedIds.includes(entry.id),
  );
  const combatantEntries = selectedEntries.filter(isCombatantEntry);
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
  const damagePlan = planGroupAction('damage', planRows);
  const healPlan = planGroupAction('heal', planRows);
  const tempHpPlan = planGroupAction('temp-hp', planRows);
  const maxHpPlan = planGroupAction('max-hp', planRows);
  const defeatedPlan = planGroupAction('defeated', planRows);
  const undefeatedPlan = planGroupAction('undefeated', planRows);
  const removePlan = planGroupAction('removed', planRows);

  const recordPlan = (plan: GroupActionPlan) => {
    void recordLogEntry(plan.kind, plan.payload);
  };

  // A removal cannot be reverted, so it waits for a confirm; the selection is left as it is whether the dialog is confirmed or closed.
  const onRemove = (plan: GroupActionPlan) => {
    openDeleteDialog({
      action: 'remove',
      oneClickConfirm: true,
      name: selectedEntries.map((entry) => entry.name).join(', '),
      onDeletionConfirm: () => {
        recordPlan(plan);
      },
    });
  };

  const onSharedAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSharedText(event.currentTarget.value);
  };

  return (
    <div className='encounter-combatant-actions-tab'>
      <div className='encounter-combatant-actions-tab-section'>
        <div className='label encounter-combatant-actions-tab-label'>HP</div>
        {combatantEntries.length > 1 && (
          <label className='encounter-combatant-actions-tab-bulk-hp'>
            <span className='label'>Set for all:</span>
            <Input
              className='number-input'
              type='number'
              min={0}
              aria-label='Shared amount'
              placeholder='Amount'
              value={sharedText}
              onChange={onSharedAmountChange}
            />
          </label>
        )}
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
        <div className='encounter-combatant-actions-tab-pair'>
          <EncounterCombatantActionButton
            label='Damage'
            plan={damagePlan}
            onRun={recordPlan}
            buttonStyle='danger'
          />
          <EncounterCombatantActionButton
            label='Heal'
            plan={healPlan}
            onRun={recordPlan}
            buttonStyle='success'
          />
        </div>
        <EncounterCombatantActionButton
          label='Set temp HP'
          plan={tempHpPlan}
          onRun={recordPlan}
        />
        <EncounterCombatantActionButton
          label='Set max HP'
          plan={maxHpPlan}
          onRun={recordPlan}
        />
      </div>

      <div className='encounter-combatant-actions-tab-section'>
        <div className='label encounter-combatant-actions-tab-label'>State</div>
        <EncounterCombatantActionButton
          label='Mark defeated'
          plan={defeatedPlan}
          onRun={recordPlan}
        />
        <EncounterCombatantActionButton
          label='Unmark defeated'
          plan={undefeatedPlan}
          onRun={recordPlan}
        />
        <EncounterCombatantActionButton
          label='Remove'
          plan={removePlan}
          onRun={onRemove}
          buttonStyle='danger'
        />
      </div>
    </div>
  );
};
