import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../../../types';
import { Input } from '@/components/Input/Input';
import './FiveEStatBlockDefenses.css';

type Props = SectionBodyProps;
export const FiveEStatBlockDefenses: FCProps<Props> = ({ readOnly }) => {
  return (
    <div>
      <label>
        <span className='label'>Resistences:</span>

        <Input
          key={'resistances'}
          type='text'
          readOnly={readOnly}
          placeholder='e. g. non-magical damage'
        />
      </label>

      <label>
        <span className='label'>Immunities:</span>

        <Input
          key={'immmunities'}
          type='text'
          readOnly={readOnly}
          placeholder='e.g. Poison, Fire, Radiant'
        />
      </label>
    </div>
  );
};
