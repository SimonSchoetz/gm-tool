import { ActionContainer } from '@/components/ActionContainer/ActionContainer';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import type { SidebarTab } from '../../../../hooks/useEncounterSelection';
// Imported after ActionContainer so this stylesheet wins the equal-specificity ties with .action-container (border: none, transparent background): an edit that moves it above leaves the tabs without their border.
import './EncounterSidebarTabs.css';

type Props = {
  tabs: { id: SidebarTab; label: string }[];
  activeTab: SidebarTab;
  onChange: (tab: SidebarTab) => void;
};

export const EncounterSidebarTabs: FCProps<Props> = ({
  tabs,
  activeTab,
  onChange,
}) => (
  <div role='tablist' className='encounter-sidebar-tabs'>
    {tabs.map(({ id, label }) => (
      <ActionContainer
        key={id}
        label={label}
        role='tab'
        aria-selected={id === activeTab}
        className={cn(
          'encounter-sidebar-tabs-tab',
          id === activeTab && 'encounter-sidebar-tabs-tab--active',
        )}
        onClick={() => {
          onChange(id);
        }}
      >
        {label}
      </ActionContainer>
    ))}
  </div>
);
