import { FCProps, HtmlProps } from '@/types';
import './Header.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { BreadcrumbList, FwBwNav, Updater } from './components';

type HeaderProps = HtmlProps<'header'>;

export const Header: FCProps<HeaderProps> = ({ ...props }) => {
  return (
    <header {...props}>
      <GlassPanel className='header-content'>
        <div className='header-nav'>
          <FwBwNav />
          <BreadcrumbList />
        </div>
        <Updater />
      </GlassPanel>
    </header>
  );
};
