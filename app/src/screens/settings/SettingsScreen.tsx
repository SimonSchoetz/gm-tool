import { CustomScrollArea, GlassPanel } from '@/components';
import {
  ListConfigSection,
  AppVersionSection,
  AppearanceSection,
} from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <CustomScrollArea childrenContainerClassName='settings-screen--sections'>
      <ListConfigSection />

      <AppVersionSection />

      <AppearanceSection />
    </CustomScrollArea>
  </GlassPanel>
);
