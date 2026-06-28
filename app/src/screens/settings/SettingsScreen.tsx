import { CustomScrollArea, GlassPanel } from '@/components';
import { ListConfigSection, AppVersionSection } from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <CustomScrollArea childrenContainerClassName='settings-screen--sections'>
      <ListConfigSection />
      <AppVersionSection />
    </CustomScrollArea>
  </GlassPanel>
);
