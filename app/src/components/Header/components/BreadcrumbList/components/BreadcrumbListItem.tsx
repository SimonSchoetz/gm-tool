import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';

export const BreadcrumbListItem: FCProps<HtmlProps<'li'>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <li className={cn(className, 'clip-text')} {...props}>
      {children}
    </li>
  );
};
