import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import './HorizontalDivider.css';

export const HorizontalDivider: FCProps<HtmlProps<'hr'>> = ({
  className,
  ...props
}) => {
  return <hr className={cn('horizontal-divider', className)} {...props} />;
};
