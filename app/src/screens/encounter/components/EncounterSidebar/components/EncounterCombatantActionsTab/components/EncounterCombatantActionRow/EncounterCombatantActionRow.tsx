import { Input } from '@/components/Input/Input';
import { FCProps } from '@/types/fcProps.type';
import type { describeQueueEntryHp } from '../../../../../../helper/describeQueueEntryHp';
import { EncounterCombatantActionRowHpBar } from './components/EncounterCombatantActionRowHpBar/EncounterCombatantActionRowHpBar';
import './EncounterCombatantActionRow.css';

type Props = {
  name: string;
  hp: ReturnType<typeof describeQueueEntryHp>;
  defeated: boolean;
  amountText: string;
  onAmountChange: (text: string) => void;
};

export const EncounterCombatantActionRow: FCProps<Props> = ({
  name,
  hp,
  defeated,
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
        <div className='encounter-combatant-action-row-hp'>
          {hp ? (
            <>
              {hp.text}
              {hp.tempHp > 0 && (
                <>
                  {' '}
                  <span className='encounter-combatant-action-row-temp'>
                    +{hp.tempHp} temp
                  </span>
                </>
              )}
              {defeated && ' · defeated'}
            </>
          ) : (
            'HP is not set. Set max HP to track it.'
          )}
        </div>
        {hp && (
          <EncounterCombatantActionRowHpBar
            lostShare={hp.lostShare}
            tempShare={hp.tempShare}
            hpText={hp.text}
            tempHp={hp.tempHp}
          />
        )}
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
