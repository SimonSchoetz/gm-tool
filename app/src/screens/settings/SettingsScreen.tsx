import { GlassPanel } from '@/components';
import { TableConfigSection, AppVersionSection } from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <TableConfigSection />
    <AppVersionSection />
  </GlassPanel>
);
