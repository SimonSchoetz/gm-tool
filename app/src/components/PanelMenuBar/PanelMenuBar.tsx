import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import './PanelMenuBar.css';

type Props = {
  title: ReactNode;
  titleProps?: HtmlProps<'div'>;
  leading?: ReactNode;
  children?: ReactNode;
};

export const PanelMenuBar: FCProps<Props> = ({
  title,
  titleProps,
  leading,
  children,
}) => (
  <div className='panel-menu-bar'>
    {/* Outside the title div, so a control here never receives titleProps — the drag handlers a pinned MentionPopup puts there. */}
    <div className='panel-menu-bar-leading'>{leading}</div>
    <div
      {...titleProps}
      className={cn('clip-text', 'panel-menu-bar-title', titleProps?.className)}
    >
      {title}
    </div>
    <div className='panel-menu-bar-actions'>{children}</div>
  </div>
);
