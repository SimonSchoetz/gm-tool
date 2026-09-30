import { CSSProperties } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './ScreensSidebar.css';
import { cn } from '@/util/className';
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
