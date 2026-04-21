import './Input.css';
import { cn } from '@/util';
import { FCProps, HtmlProps } from '@/types';

const Input: FCProps<HtmlProps<'input'>> = ({ className, ...props }) => {
  return <input className={cn('input', className)} {...props} />;
};

export default Input;
