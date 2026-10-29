import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { FCProps } from '@/types/fcProps.type';
import type { SidebarTab } from '../../hooks/useEncounterSelection';
import { EncounterAddTab } from './components/EncounterAddTab';
import { EncounterCombatantActionsTab } from './components/EncounterCombatantActionsTab';
import { EncounterSidebarPanel } from './components/EncounterSidebarPanel/EncounterSidebarPanel';
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

export const EncounterSidebar: FCProps<Props> = ({
  activeTab,
  onTabChange,
  selectedId,
}) => (
  <GlassPanel className='encounter-sidebar'>
    <EncounterSidebarTabs
      tabs={TABS}
      activeTab={activeTab}
      onChange={onTabChange}
    />
    <EncounterSidebarPanel aria-label='Add' hidden={activeTab !== 'add'}>
      <EncounterAddTab />
    </EncounterSidebarPanel>
    <EncounterSidebarPanel
      aria-label='Actions'
      hidden={activeTab !== 'actions'}
    >
      <EncounterCombatantActionsTab selectedId={selectedId} />
    </EncounterSidebarPanel>
  </GlassPanel>
);
