import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { EncounterAddTab } from './components/EncounterAddTab';
import './EncounterSidePanel.css';

export const EncounterSidePanel = () => (
  <GlassPanel className='encounter-side-panel'>
    <div className='encounter-side-panel-tabs'>
      <span className='encounter-side-panel-tab'>Add</span>
    </div>
    <EncounterAddTab />
  </GlassPanel>
);
