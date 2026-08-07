import { FCProps, HtmlProps } from '@/types';
import './ScreensSidebar.css';
import { CustomScrollArea } from '@/components';
import { cn } from '@/util';

type Props = HtmlProps<'aside'>;

export const ScreensSidebar: FCProps<Props> = ({
  children,
  className,
  ...props
}) => {
  return (
    <aside className={cn('screens-sidebar', className)} {...props}>
      <CustomScrollArea childrenContainerClassName='screens-sidebar--content-container'>
        {children}
      </CustomScrollArea>
    </aside>
  );
};
