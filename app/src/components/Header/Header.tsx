import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { useAdventure, useNpc, useSession } from '@/data-access-layer';
import { useRouterState } from '@tanstack/react-router';
import { Routes } from '@/routes';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  const router = useRouterState();

  // Extract adventureId from route if present
  const adventureIdMatch = router.location.href.match(/\/adventure\/([^\/]+)/);
  const adventureId = adventureIdMatch ? adventureIdMatch[1] : '';

  // Extract npcId from route if present
  const npcIdMatch = router.location.href.match(/\/npc\/([^\/]+)/);
  const npcId = npcIdMatch ? npcIdMatch[1] : '';

  // Extract sessionId from route if present
  const sessionIdMatch = router.location.href.match(/\/session\/([^\/]+)/);
  const sessionId = sessionIdMatch ? sessionIdMatch[1] : '';

  const { adventure } = useAdventure(adventureId);
  const { npc } = useNpc(npcId);
  const { session } = useSession(sessionId, adventureId);

  const getMainRoute = (): string => {
    if (router.location.href === `/${Routes.ADVENTURES}`) {
      return 'Adventures';
    }
    if (router.location.href.includes(Routes.ADVENTURE)) {
      return `${adventure?.name ?? 'Loading...'}`;
    }
    return 'GM Tool';
  };

  const getRouteLevel1 = (): string => {
    if (router.location.href.includes(Routes.NPCS) || router.location.href.includes(`/${Routes.NPC}/`)) {
      return ' > NPCs';
    }
    if (
      router.location.href.includes(Routes.SESSIONS) ||
      router.location.href.includes(`/${Routes.SESSION}/`)
    ) {
      return ' > Sessions';
    }
    return '';
  };

  const getRouteLevel2 = (): string => {
    if (router.location.href.includes(`/${Routes.NPC}/`)) {
      return ` > ${npc?.name ?? 'Loading...'}`;
    }
    if (router.location.href.includes(`/${Routes.SESSION}/`)) {
      return ` > ${session?.name ?? 'Loading...'}`;
    }
    return '';
  };

  const getHeading = (): string => {
    const mainRoute = getMainRoute();
    const level1 = getRouteLevel1();
    const level2 = getRouteLevel2();

    return mainRoute + level1 + level2;
  };

  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        <h1>{getHeading()}</h1>
      </GlassPanel>
    </header>
  );
};
