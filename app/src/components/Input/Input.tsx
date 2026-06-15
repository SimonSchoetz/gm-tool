import './Input.css';
import { cn } from '@/util';
import { FCProps, HtmlProps } from '@/types';

export const Input: FCProps<HtmlProps<'input'>> = ({ className, ...props }) => {
  return <input className={cn('input', className)} {...props} />;
};
