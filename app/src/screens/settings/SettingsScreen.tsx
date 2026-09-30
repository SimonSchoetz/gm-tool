import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { ListConfigSection } from './components/ListConfigSection';
import { AppearanceSection } from './components/AppearanceSection/AppearanceSection';
import { DevicesSection } from './components/DevicesSection';
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
