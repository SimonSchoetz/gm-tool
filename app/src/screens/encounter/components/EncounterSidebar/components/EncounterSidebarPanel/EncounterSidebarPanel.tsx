import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './EncounterSidebarPanel.css';

type Props = Omit<HtmlProps<'div'>, 'role' | 'className'>;

export const EncounterSidebarPanel: FCProps<Props> = ({
  children,
  ...props
}) => (
  <div role='tabpanel' className='encounter-sidebar-panel' {...props}>
    {children}
  </div>
);
