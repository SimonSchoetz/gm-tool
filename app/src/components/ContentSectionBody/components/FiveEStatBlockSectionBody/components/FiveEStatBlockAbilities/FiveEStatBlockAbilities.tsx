import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../../../types';
import { Input } from '@/components/Input/Input';
import './FiveEStatBlockAbilities.css';

type Props = SectionBodyProps;
export const FiveEStatBlockAbilities: FCProps<Props> = ({ readOnly }) => {
  return (
    <div className='five-e-stat-block-abilities'>
      <div className='five-e-stat-block-abilities-row-header'>
        <div></div>

        <div className='label'>MOD</div>
        <div className='label'>SAVE</div>
      </div>

      <label>
        <span className='label'>STR</span>

        <Input
          className='number-input'

          key={'str-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'str-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>

      <label>
        <span className='label'>DEX</span>

        <Input
          className='number-input'

          key={'dex-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'dex-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>

      <label>
        <span className='label'>CON</span>

        <Input
          className='number-input'

          key={'con-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'con-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>

      <label>
        <span className='label'>INT</span>

        <Input
          className='number-input'

          key={'int-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'int-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>

      <label>
        <span className='label'>WIS</span>

        <Input
          className='number-input'

          key={'wis-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'wis-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>

      <label>
        <span className='label'>CHA</span>

        <Input
          className='number-input'

          key={'cha-mod'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />

        <Input
          className='number-input'

          key={'cha-save'}
          type='number'
          readOnly={readOnly}
          placeholder='0'
          maxLength={1}
        />
      </label>
    </div>
  );
};
