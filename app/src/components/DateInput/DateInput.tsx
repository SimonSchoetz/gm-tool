import { cn } from '@/util';
import { FCProps, HtmlProps } from '@/types';
import './DateInput.css';

type DateInputProps = Omit<HtmlProps<'input'>, 'type'>;

export const DateInput: FCProps<DateInputProps> = ({ className, ...props }) => {
  return (
    <input type='date' className={cn('date-input', className)} {...props} />
  );
};
