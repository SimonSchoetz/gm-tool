import { useEffect, useState } from 'react';

export type SidebarTab = 'add' | 'actions';

export const useEncounterSelection = (
  encounterId: string,
  shownIds: string[],
): {
  selectedId: string | null;
  activeTab: SidebarTab;
  select: (id: string) => void;
  setActiveTab: (tab: SidebarTab) => void;
} => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('add');
  const [prevEncounterId, setPrevEncounterId] = useState(encounterId);

  // The route component stays mounted when only the encounter id changes (Duplicate navigates to the copy), so the copy would otherwise open on the Actions tab with the old selection.
  if (encounterId !== prevEncounterId) {
    setPrevEncounterId(encounterId);
    setSelectedId(null);
    setActiveTab('add');
  }

  // The id is cleared in state, so it stays cleared when the combatant returns (Hide defeated off, a later revert); hiding the selection only in the UI would bring it back.
  if (selectedId !== null && !shownIds.includes(selectedId)) {
    setSelectedId(null);
  }

  useEffect(() => {
    const clearOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    document.addEventListener('keydown', clearOnEscape);
    return () => {
      document.removeEventListener('keydown', clearOnEscape);
    };
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    setActiveTab('actions');
  };

  return { selectedId, activeTab, select, setActiveTab };
};
