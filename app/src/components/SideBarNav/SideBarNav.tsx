import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { FwBwNav } from './components';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { useRouterState } from '@tanstack/react-router';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps = ({ ...props }) => {
  const router = useRouterState();

  // Extract adventureId from URL if it exists
  const adventureIdMatch =
    /\/adventure\/([^/]+)/.exec(router.location.pathname);
  const adventureId = adventureIdMatch?.[1];

  return (
    <aside className='sidebar-nav' {...props}>
      <GlassPanel>
        <FwBwNav />
        <ScreenNavBtn
          label='Adventures'
          to='/adventures'
        />

        <ScreenNavBtn
          label='NPCs'
          to='/adventure/$adventureId/npcs'
          params={{ adventureId: adventureId ?? '' }}
          isDisabled={!adventureId}
        />

        <ScreenNavBtn
          label='Sessions'
          to='/adventure/$adventureId/sessions'
          params={{ adventureId: adventureId ?? '' }}
          isDisabled={!adventureId}
        />

        <ScreenNavBtn
          label='Settings'
          to='/settings'
        />
      </GlassPanel>
    </aside>
  );
};
