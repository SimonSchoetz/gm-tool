import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../../../types';
import { Input } from '@/components/Input/Input';
import './FiveEStatBlockMisc.css';

type Props = SectionBodyProps;
export const FiveEStatBlockMisc: FCProps<Props> = ({ readOnly }) => {
  return (
    <div>
      <label>
        <span className='label'>Senses:</span>

        <Input
          key={'senses'}
          type='text'
          readOnly={readOnly}
          placeholder='e.g. passive Perception 16, Darkvision 60 ft.'
        />
      </label>

      <label>
        <span className='label'>Skills:</span>

        <Input
          key={'senses'}
          type='text'
          readOnly={readOnly}
          placeholder='e.g. Perception +5'
        />
      </label>

      <label>
        <span className='label'>Languages:</span>

        <Input
          key={'languages'}
          type='text'
          readOnly={readOnly}
          placeholder='e.g. Common, Elvish, Giant'
        />
      </label>
    </div>
  );
};
