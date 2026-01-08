import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        Header
      </GlassPanel>
    </header>
  );
};
