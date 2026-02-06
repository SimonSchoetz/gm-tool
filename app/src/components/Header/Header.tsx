import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { useAdventures } from '@/providers/adventures';
import { useRouterState } from '@tanstack/react-router';
import { Routes } from '@/routes';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  const router = useRouterState();
  const { adventure } = useAdventures();

  const getMainRoute = (): string => {
    if (router.location.href === Routes.ADVENTURES) {
      return 'Adventures';
    }
    if (router.location.href.includes(Routes.ADVENTURE)) {
      return `${adventure?.title}`;
    }
    return 'GM Tool';
  };

  const getRouteLevel1 = (): string => {
    if (router.location.href.includes(Routes.NPCS)) {
      return ' > NPCs';
    }
    return '';
  };

  const getHeading = (): string => {
    const mainRoute = getMainRoute();
    const level1 = getRouteLevel1();

    return mainRoute + level1;
  };

  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        <h1>{getHeading()}</h1>
      </GlassPanel>
    </header>
  );
};
