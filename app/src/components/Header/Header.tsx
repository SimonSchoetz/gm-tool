import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './Header.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { BreadcrumbList } from './components/BreadcrumbList';
import { FwBwNav } from './components/FwBwNav/FwBwNav';
import { SettingsBtn } from './components/SettingsBtn/SettingsBtn';
import { Updater } from './components/Updater/Updater';

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
