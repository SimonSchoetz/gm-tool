import { CSSProperties } from 'react';
import { FCProps, HtmlProps } from '@/types';
import './ScreensSidebar.css';
import { cn } from '@/util';
import { PREVIEW_WIDTH } from '../../screens.constants';

type Props = HtmlProps<'aside'>;

export const ScreensSidebar: FCProps<Props> = ({
  children,
  className,
  ...props
}) => {
  return (
    <aside
      className={cn('screens-sidebar', className)}
      style={
        {
          '--screens-sidebar-base-width': `${PREVIEW_WIDTH}px`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </aside>
  );
};
