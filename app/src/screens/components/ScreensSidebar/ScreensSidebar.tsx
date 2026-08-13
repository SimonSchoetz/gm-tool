import { FCProps, HtmlProps } from '@/types';
import './ScreensSidebar.css';
import { cn } from '@/util';

type Props = HtmlProps<'aside'>;

export const ScreensSidebar: FCProps<Props> = ({
  children,
  className,
  ...props
}) => {
  return (
    <aside className={cn('screens-sidebar', className)} {...props}>
      {children}
    </aside>
  );
};
