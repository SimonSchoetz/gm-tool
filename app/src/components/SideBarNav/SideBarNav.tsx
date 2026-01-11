import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { FwBwNav } from './components';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { Routes } from '@/routes';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  return (
    <aside {...props}>
      <GlassPanel>
        <FwBwNav />
        <ScreenNavBtn label='Adventures' targetRoute={Routes.ADVENTURES} />
      </GlassPanel>
    </aside>
  );
};
