import { FCProps } from '@/types/fcProps.type';
import type { FiveEStatBlockGroupProps } from '../../types';
import { FiveEStatBlockTextField } from '../FiveEStatBlockTextField/FiveEStatBlockTextField';
import './FiveEStatBlockMisc.css';

export const FiveEStatBlockMisc: FCProps<FiveEStatBlockGroupProps> = ({
  readOnly,
  values,
  saveField,
}) => {
  return (
    <div className='five-e-stat-block-misc'>
      <FiveEStatBlockTextField
        saveField={saveField}
        field='senses'
        label='Senses:'
        placeholder='e.g. passive Perception 16, Darkvision 60 ft.'
        savedValue={values.senses}
        readOnly={readOnly}
      />

      <FiveEStatBlockTextField
        saveField={saveField}
        field='skills'
        label='Skills:'
        placeholder='e.g. Perception +5'
        savedValue={values.skills}
        readOnly={readOnly}
      />

      <FiveEStatBlockTextField
        saveField={saveField}
        field='languages'
        label='Languages:'
        placeholder='e.g. Common, Elvish, Giant'
        savedValue={values.languages}
        readOnly={readOnly}
      />
    </div>
  );
};
