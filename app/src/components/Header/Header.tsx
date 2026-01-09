import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { useAdventures } from '@/data/adventures';
import { useRouterState } from '@tanstack/react-router';
import { Routes } from '@/routes';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  const router = useRouterState();

  const getHeading = (): string => {
    if (router.location.href === Routes.ADVENTURES) {
      return 'Adventures';
    }
    if (router.location.href.includes(Routes.ADVENTURE)) {
      const { adventure } = useAdventures();
      return `${adventure?.title}`;
    }
    return 'GM Tool';
  };

  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        <h1>{getHeading()}</h1>
      </GlassPanel>
    </header>
  );
};
