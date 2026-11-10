import { Input } from '@/components/Input/Input';
import { FCProps } from '@/types/fcProps.type';
import './EncounterCombatantActionRow.css';

type Props = {
  name: string;
  hpText: string;
  amountText: string;
  onAmountChange: (text: string) => void;
};

export const EncounterCombatantActionRow: FCProps<Props> = ({
  name,
  hpText,
  amountText,
  onAmountChange,
}) => {
  const onAmountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onAmountChange(event.currentTarget.value);
  };

  return (
    <div className='encounter-combatant-action-row'>
      <div className='encounter-combatant-action-row-text'>
        <div className='clip-text'>{name}</div>
        <div className='encounter-combatant-action-row-hp'>{hpText}</div>
      </div>

      <Input
        className='encounter-combatant-action-row-amount number-input'
        type='number'
        min={0}
        aria-label={`Amount for ${name}`}
        placeholder='Amount'
        value={amountText}
        onChange={onAmountInputChange}
      />
    </div>
  );
};
