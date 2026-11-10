import './Input.css';
import { cn } from '@/util/className';
import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';

export const Input: FCProps<HtmlProps<'input'>> = ({ className, ...props }) => {
  const valueTitle = props.value?.toString();

  return (
    <input className={cn('input', className)} title={valueTitle} {...props} />
  );
};
