import { FCProps, HtmlProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import { BreadcrumbList } from './components';

type HeaderProps = HtmlProps<'header'>;

export const Header: FCProps<HeaderProps> = ({ ...props }) => {
  return (
    <header {...props}>
      <GlassPanel className={cn('header-content')}>
        <BreadcrumbList />
      </GlassPanel>
    </header>
  );
};
