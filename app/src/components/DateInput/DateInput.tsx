import { useRef } from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/util';
import { FCProps, HtmlProps } from '@/types';
import { ClickableIcon } from '../ClickableIcon/ClickableIcon';
import './DateInput.css';

type DateInputProps = Omit<HtmlProps<'input'>, 'type'>;

export const DateInput: FCProps<DateInputProps> = ({ className, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('date-input-wrapper', className)}>
      <input ref={inputRef} type='date' className='date-input' {...props} />
      <ClickableIcon
        icon={<CalendarIcon className='date-input-icon' />}
        label='Open date picker'
        title='Open date picker'
        onClick={() => {
          inputRef.current?.showPicker();
        }}
      />
    </div>
  );
};
