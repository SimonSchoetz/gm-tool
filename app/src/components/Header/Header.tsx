import { FCProps, HtmlProps } from '@/types';
import './Header.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { BreadcrumbList, FwBwNav, SettingsBtn, Updater } from './components';

type HeaderProps = HtmlProps<'header'>;

export const Header: FCProps<HeaderProps> = ({ ...props }) => {
  return (
    <header {...props}>
      <GlassPanel className='header-content'>
        <div className='header-btns'>
          <SettingsBtn />

          <FwBwNav />
        </div>

        <BreadcrumbList />

        <div className='header--app-status'>
          {/* will have sync progress indicator here */}
          <Updater />
        </div>
      </GlassPanel>
    </header>
  );
};
