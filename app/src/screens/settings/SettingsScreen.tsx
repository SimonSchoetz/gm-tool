import { CustomScrollArea, GlassPanel } from '@/components';
import {
  ListConfigSection,
  AppearanceSection,
  DevicesSection,
} from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <CustomScrollArea childrenContainerClassName='settings-screen--sections'>
      <AppearanceSection />

      <ListConfigSection />

      <DevicesSection />
    </CustomScrollArea>
  </GlassPanel>
);
