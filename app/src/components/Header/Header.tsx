import { FCProps, HtmlProps } from '@/types';
import './Header.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import { BreadcrumbList } from './components';

type HeaderProps = HtmlProps<'header'>;

export const Header: FCProps<HeaderProps> = ({ ...props }) => {
  return (
    <header {...props}>
      <GlassPanel className='header-content'>
        <BreadcrumbList />
      </GlassPanel>
    </header>
  );
};
