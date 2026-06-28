import { CustomScrollArea, GlassPanel } from '@/components';
import { ListConfigSection, AppearanceSection } from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <CustomScrollArea childrenContainerClassName='settings-screen--sections'>
      <AppearanceSection />

      <ListConfigSection />
    </CustomScrollArea>
  </GlassPanel>
);
