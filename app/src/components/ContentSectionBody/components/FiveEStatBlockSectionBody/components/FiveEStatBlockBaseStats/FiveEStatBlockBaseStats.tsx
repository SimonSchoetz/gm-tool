import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../../../types';
import { Input } from '@/components/Input/Input';
import './FiveEStatBlockBaseStats.css';

type Props = SectionBodyProps;
export const FiveEStatBlockBaseStats: FCProps<Props> = ({ readOnly }) => {
  return (
    <div className='five-e-stat-block-base-stats'>
      <div className='five-e-stat-block-base-stats-row-one'>
        <label>
          <span className='label'>HP:</span>
          <Input
            className='number-input'

            key={'hp'}
            type='number'
            readOnly={readOnly}
            placeholder='000'
            maxLength={3}
          />
        </label>

        <label>
          <span className='label'>AC:</span>
          <Input
            className='number-input'
            key={'ac'}
            type='number'
            readOnly={readOnly}
            placeholder='00'
            maxLength={2}
          />
        </label>

        <label>
          <span className='label'>Initiative:</span>
          <Input
            className='number-input'
            key={'inititative'}
            type='number'
            readOnly={readOnly}
            placeholder='0'
            maxLength={2}
          />
        </label>

        <label>
          <span className='label'>Proficiency Bonus:</span>
          <Input
            className='number-input'
            key={'proficiency bonus'}
            type='number'
            readOnly={readOnly}
            placeholder='0'
            maxLength={1}
          />
        </label>
      </div>

      <div className='five-e-stat-block-base-stats-row-two'>
        <label>
          <span className='label'>Speed:</span>
          <Input
            key={'speed'}
            type='text'
            readOnly={readOnly}
            placeholder='30, Fly 60'
          />
        </label>
        {/*
        <label>
          <span className='label'>Size:</span>
          <Input
            key={'size'}
            type='text'
            readOnly={readOnly}
            placeholder='medium'
          />
        </label>*/}

        <label>
          <span className='label'>Creature Type:</span>
          <Input
            key={'creature type'}
            type='text'
            readOnly={readOnly}
            placeholder='Large Monstrosity'
          />
        </label>
      </div>
    </div>
  );
};
