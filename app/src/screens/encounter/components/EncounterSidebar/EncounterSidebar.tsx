import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
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

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'add', label: 'Add' },
  { id: 'actions', label: 'Actions' },
  { id: 'log', label: 'Log' },
];

export const EncounterSidebar: FCProps<Props> = ({
  activeTab,
  onTabChange,
  selectedIds,
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
      <EncounterCombatantActionsTab selectedIds={selectedIds} />
    </EncounterSidebarPanel>
    <EncounterSidebarPanel aria-label='Log' hidden={activeTab !== 'log'}>
      <EncounterLogTab
        // Stryker disable next-line ConditionalExpression,EqualityOperator,StringLiteral: isOpen only decides the scroll to the newest line, and jsdom computes no scroll height
        isOpen={activeTab === 'log'}
      />
    </EncounterSidebarPanel>
  </GlassPanel>
);
