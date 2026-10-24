import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockGroupProps } from '../../types';
import { FiveEStatBlockNumberField } from '../FiveEStatBlockNumberField/FiveEStatBlockNumberField';
import './FiveEStatBlockAbilities.css';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export const FiveEStatBlockAbilities: FCProps<FiveEStatBlockGroupProps> = ({
  readOnly,
  values,
  saveField,
}) => {
  return (
    <div className='five-e-stat-block-abilities'>
      <div className='five-e-stat-block-abilities-row-header'>
        <div></div>

        <div className='label'>MOD</div>
        <div className='label'>SAVE</div>
      </div>

      {ABILITIES.map((ability) => {
        const modField = `${ability}Mod` as const;
        const saveFieldKey = `${ability}Save` as const;
        return (
          <label key={ability}>
            <span className='label'>{ability.toUpperCase()}</span>

            <FiveEStatBlockNumberField
              saveField={saveField}
              field={modField}
              placeholder='0'
              savedValue={values[modField]}
              readOnly={readOnly}
            />

            <FiveEStatBlockNumberField
              saveField={saveField}
              field={saveFieldKey}
              placeholder='0'
              savedValue={values[saveFieldKey]}
              readOnly={readOnly}
            />
          </label>
        );
      })}
    </div>
  );
};
