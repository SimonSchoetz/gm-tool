import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './HorizontalDivider.css';

export const HorizontalDivider: FCProps<HtmlProps<'hr'>> = ({
  className,
  ...props
}) => {
  return <hr className={cn('horizontal-divider', className)} {...props} />;
};
