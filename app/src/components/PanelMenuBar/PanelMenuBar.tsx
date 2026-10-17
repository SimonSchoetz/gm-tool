import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import './PanelMenuBar.css';

type Props = {
  title: ReactNode;
  titleProps?: HtmlProps<'div'>;
  children?: ReactNode;
};

export const PanelMenuBar: FCProps<Props> = ({
  title,
  titleProps,
  children,
}) => (
  <div className='panel-menu-bar'>
    <div
      {...titleProps}
      className={cn('clip-text', 'panel-menu-bar-title', titleProps?.className)}
    >
      {title}
    </div>
    <div className='panel-menu-bar-actions'>{children}</div>
  </div>
);
