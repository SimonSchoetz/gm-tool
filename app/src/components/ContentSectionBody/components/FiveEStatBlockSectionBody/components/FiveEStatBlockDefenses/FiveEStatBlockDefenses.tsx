import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockGroupProps } from '../../types';
import { FiveEStatBlockTextField } from '../FiveEStatBlockTextField/FiveEStatBlockTextField';
import './FiveEStatBlockDefenses.css';

export const FiveEStatBlockDefenses: FCProps<FiveEStatBlockGroupProps> = ({
  readOnly,
  values,
  saveField,
}) => {
  return (
    <div className='five-e-stat-block-defenses'>
      <FiveEStatBlockTextField
        saveField={saveField}
        field='resistances'
        label='Resistances:'
        placeholder='e. g. non-magical damage'
        savedValue={values.resistances}
        readOnly={readOnly}
      />

      <FiveEStatBlockTextField
        saveField={saveField}
        field='immunities'
        label='Immunities:'
        placeholder='e.g. Poison, Fire, Radiant'
        savedValue={values.immunities}
        readOnly={readOnly}
      />
    </div>
  );
};
