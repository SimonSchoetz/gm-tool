import { FCProps } from '@/types/fcProps.type';
import './EncounterCombatantActionRowHpBar.css';

type Props = {
  lostShare: number;
  tempShare: number;
  hpText: string;
  tempHp: number;
};

export const EncounterCombatantActionRowHpBar: FCProps<Props> = ({
  lostShare,
  tempShare,
  hpText,
  tempHp,
}) => {
  const style = {
    '--rt-encounter-combatant-action-row-hp-bar-lost': lostShare,
    '--rt-encounter-combatant-action-row-hp-bar-temp': tempShare,
  } as React.CSSProperties;
  const ariaLabel = `HP bar: ${hpText}, ${tempHp} temp`;

  return (
    <div
      className='encounter-combatant-action-row-hp-bar'
      role='img'
      aria-label={ariaLabel}
      style={style}
    >
      <div className='encounter-combatant-action-row-hp-bar-lost' />
      <div className='encounter-combatant-action-row-hp-bar-temp' />
    </div>
  );
};
