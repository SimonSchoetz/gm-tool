import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';

import { FwBwNav } from './components';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  return (
    <aside {...props}>
      <GlassPanel>
        <FwBwNav />
      </GlassPanel>
    </aside>
  );
};
