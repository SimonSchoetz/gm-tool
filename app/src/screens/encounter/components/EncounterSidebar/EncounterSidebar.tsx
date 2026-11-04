import { FCProps } from '@/types/fcProps.type';
import type { SidebarTab } from '../../hooks/useEncounterSelection';
import { EncounterAddTab } from './components/EncounterAddTab';
import { EncounterCombatantActionsTab } from './components/EncounterCombatantActionsTab';
import { EncounterLogTab } from './components/EncounterLogTab';
import { EncounterSidebarPanel } from './components/EncounterSidebarPanel/EncounterSidebarPanel';
import { EncounterSidebarTabs } from './components/EncounterSidebarTabs/EncounterSidebarTabs';
import './EncounterSidebar.css';

type Props = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  selectedIds: string[];
};

export const EncounterSidebar: FCProps<Props> = ({
  activeTab,
  onTabChange,
  selectedIds,
}) => (
  <div className='encounter-sidebar'>
    <EncounterSidebarTabs activeTab={activeTab} onChange={onTabChange} />
    <EncounterSidebarPanel aria-label='Add' hidden={activeTab !== 'add'}>
      <EncounterAddTab />
    </EncounterSidebarPanel>
    <EncounterSidebarPanel
      aria-label='Actions'
      hidden={activeTab !== 'actions'}
    >
      <EncounterCombatantActionsTab selectedIds={selectedIds} />
    </EncounterSidebarPanel>
    <EncounterSidebarPanel aria-label='Log' hidden={activeTab !== 'log'}>
      <EncounterLogTab isOpen={activeTab === 'log'} />
    </EncounterSidebarPanel>
  </div>
);
