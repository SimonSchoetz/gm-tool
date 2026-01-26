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

  return (
    <aside {...props}>
      <GlassPanel>
        <FwBwNav />
        <ScreenNavBtn label='Adventures' targetRoute={Routes.ADVENTURES} />

        <ScreenNavBtn
          label='NPCs'
          targetRoute={Routes.NPCS}
          searchParams={getPossibleAdventureIdSearchParam(
            router.location.pathname,
          )}
        />
      </GlassPanel>
    </aside>
  );
};

const getPossibleAdventureIdSearchParam = (
  pathname: string,
): Record<string, string> | undefined => {
  const adventureIdMatch = pathname.match(/\/adventure\/([^/]+)/);
  const adventureId = adventureIdMatch?.[1];
  return (adventureId && { adventureId }) || undefined;
};
