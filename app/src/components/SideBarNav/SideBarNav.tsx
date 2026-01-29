import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { FwBwNav } from './components';
import { ScreenNavBtn } from './components/ScreenNavBtn/ScreenNavBtn';
import { Routes } from '@/routes';
import { useRouterState } from '@tanstack/react-router';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  const router = useRouterState();

  // Extract adventureId from URL if it exists
  const adventureIdMatch =
    router.location.pathname.match(/\/adventure\/([^/]+)/);
  const adventureId = adventureIdMatch?.[1];

  return (
    <aside {...props}>
      <GlassPanel>
        <FwBwNav />
        <ScreenNavBtn label='Adventures' targetRoute={Routes.ADVENTURES} />

        <ScreenNavBtn
          label='NPCs'
          targetRoute={`/adventure/${adventureId}/npcs`}
          isDisabled={!adventureId}
        />
      </GlassPanel>
    </aside>
  );
};
