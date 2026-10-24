import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockNumberKey } from '@domain';
import type { FiveEStatBlockGroupProps } from '../../types';
import { FiveEStatBlockNumberField } from '../FiveEStatBlockNumberField/FiveEStatBlockNumberField';
import { FiveEStatBlockTextField } from '../FiveEStatBlockTextField/FiveEStatBlockTextField';
import './FiveEStatBlockBaseStats.css';

type NumberFieldConfig = {
  field: FiveEStatBlockNumberKey;
  label: string;
  placeholder: string;
};

const ROW_ONE_FIELDS: NumberFieldConfig[] = [
  { field: 'hp', label: 'HP:', placeholder: '000' },
  { field: 'ac', label: 'AC:', placeholder: '00' },
  { field: 'initiative', label: 'Initiative:', placeholder: '0' },
  {
    field: 'proficiencyBonus',
    label: 'Proficiency Bonus:',
    placeholder: '0',
  },
];

export const FiveEStatBlockBaseStats: FCProps<FiveEStatBlockGroupProps> = ({
  readOnly,
  values,
  saveField,
}) => {
  return (
    <div className='five-e-stat-block-base-stats'>
      <div className='five-e-stat-block-base-stats-row-one'>
        {ROW_ONE_FIELDS.map(({ field, label, placeholder }) => (
          <label key={field}>
            <span className='label'>{label}</span>
            <FiveEStatBlockNumberField
              saveField={saveField}
              field={field}
              placeholder={placeholder}
              savedValue={values[field]}
              readOnly={readOnly}
            />
          </label>
        ))}
      </div>

      <div className='five-e-stat-block-base-stats-row-two'>
        <FiveEStatBlockTextField
          saveField={saveField}
          field='speed'
          className='five-e-stat-block-base-stats-speed'
          label='Speed:'
          placeholder='30, Fly 60'
          savedValue={values.speed}
          readOnly={readOnly}
        />

        <FiveEStatBlockTextField
          saveField={saveField}
          field='creatureType'
          className='five-e-stat-block-base-stats-creature-type'
          label='Creature Type:'
          placeholder='Large Monstrosity'
          savedValue={values.creatureType}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
