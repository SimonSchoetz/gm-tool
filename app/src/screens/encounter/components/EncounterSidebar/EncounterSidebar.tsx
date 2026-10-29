import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import type { SidebarTab } from '../../hooks/useEncounterSelection';
import { EncounterAddTab } from './components/EncounterAddTab';
import { EncounterCombatantActionsTab } from './components/EncounterCombatantActionsTab/EncounterCombatantActionsTab';
import { EncounterSidebarTabs } from './components/EncounterSidebarTabs/EncounterSidebarTabs';
import './EncounterSidebar.css';

type Props = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  selectedId: string | null;
};

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'add', label: 'Add' },
  { id: 'actions', label: 'Actions' },
];

export const EncounterSidebar = ({
  activeTab,
  onTabChange,
  selectedId,
}: Props) => (
  <GlassPanel className='encounter-sidebar'>
    <EncounterSidebarTabs
      tabs={TABS}
      activeTab={activeTab}
      onChange={onTabChange}
    />
    <div
      role='tabpanel'
      aria-label='Add'
      hidden={activeTab !== 'add'}
      className='encounter-sidebar-panel'
    >
      <EncounterAddTab />
    </div>
    <div
      role='tabpanel'
      aria-label='Actions'
      hidden={activeTab !== 'actions'}
      className='encounter-sidebar-panel'
    >
      <EncounterCombatantActionsTab selectedId={selectedId} />
    </div>
  </GlassPanel>
);
