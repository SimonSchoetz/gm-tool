import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { useAdventures } from '@/data/adventures';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  const { adventure } = useAdventures();

  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        {adventure ? adventure.title : 'GM Tool'}
      </GlassPanel>
    </header>
  );
};
