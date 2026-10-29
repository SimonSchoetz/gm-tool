import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { EncounterAddTab } from './components/EncounterAddTab';
import './EncounterAddSidebar.css';

export const EncounterAddSidebar = () => (
  <GlassPanel className='encounter-add-sidebar'>
    <span className='encounter-add-sidebar-heading'>Add</span>
    <EncounterAddTab />
  </GlassPanel>
);
