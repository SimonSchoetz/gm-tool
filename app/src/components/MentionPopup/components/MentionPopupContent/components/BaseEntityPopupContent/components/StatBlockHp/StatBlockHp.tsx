import { FCProps } from '@/types/fcProps.type';
import { BASIC_STAT_BLOCK_HP_LABEL } from '@domain';
import './StatBlockHp.css';

type Props = {
  hp: { value: number | null } | null;
};

export const StatBlockHp: FCProps<Props> = ({ hp }) => {
  if (hp === null) return null;

  return (
    <div className='stat-block-hp'>
      <span className='label'>{BASIC_STAT_BLOCK_HP_LABEL}</span>
      {hp.value}
    </div>
  );
};
