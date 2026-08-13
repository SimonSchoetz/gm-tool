import { GlassPanel } from '@/components';
import {
  ListConfigSection,
  AppearanceSection,
  DevicesSection,
} from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => (
  <GlassPanel className='settings-screen'>
    <div className='settings-screen--content'>
      <AppearanceSection />

      <ListConfigSection />

      <DevicesSection />
    </div>
  </GlassPanel>
);
