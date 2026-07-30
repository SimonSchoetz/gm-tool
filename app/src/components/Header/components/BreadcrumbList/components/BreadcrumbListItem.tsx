import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';

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
