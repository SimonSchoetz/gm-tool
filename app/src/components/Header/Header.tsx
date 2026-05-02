import { FCProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { BreadcrumbList } from './components';

type Props = object;

export const Header: FCProps<Props> = ({ ...props }) => {
  return (
    <header>
      <GlassPanel className={cn('header-content')} {...props}>
        <BreadcrumbList />
      </GlassPanel>
    </header>
  );
};
