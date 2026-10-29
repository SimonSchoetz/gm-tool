import { useEffect, useState } from 'react';
import { applySelectionClick } from '../helper/applySelectionClick';
import type {
  SelectionModifiers,
  SelectionState,
} from '../helper/applySelectionClick';
import { pruneSelection } from '../helper/pruneSelection';

export type SidebarTab = 'add' | 'actions' | 'log';

// Stryker disable next-line ArrayDeclaration: the prune on every render drops an id that is not shown, so no input observes a difference
const EMPTY_SELECTION: SelectionState = { ids: [], anchorId: null };

export const useEncounterSelection = (
  encounterId: string,
  shownIds: string[],
): {
  selectedIds: string[];
  activeTab: SidebarTab;
  select: (id: string, modifiers: SelectionModifiers) => void;
  setActiveTab: (tab: SidebarTab) => void;
} => {
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [activeTab, setActiveTab] = useState<SidebarTab>('add');
  const [prevEncounterId, setPrevEncounterId] = useState(encounterId);

  // The route component stays mounted when only the encounter id changes (Duplicate navigates to the copy), so the copy would otherwise open on the Actions tab with the old selection.
  if (encounterId !== prevEncounterId) {
    setPrevEncounterId(encounterId);
    setSelection(EMPTY_SELECTION);
    setActiveTab('add');
  }

  // The ids are cleared in state, so they stay cleared when the combatant returns (Hide defeated off, a later revert); hiding the selection only in the UI would bring it back.
  const pruned = pruneSelection(selection, shownIds);
  if (pruned !== selection) {
    setSelection(pruned);
  }

  useEffect(
    () => {
      const clearOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setSelection(EMPTY_SELECTION);
      };
      document.addEventListener('keydown', clearOnEscape);
      return () => {
        document.removeEventListener('keydown', clearOnEscape);
      };
    },
    // Stryker disable next-line ArrayDeclaration: a dependency array holding one constant never changes between renders, so the effect runs once as with an empty one
    [],
  );

  const select = (id: string, modifiers: SelectionModifiers) => {
    setSelection((current) =>
      applySelectionClick(current, shownIds, id, modifiers),
    );
    // Only the Add tab follows a selecting click, a Cmd/Ctrl-click that leaves nothing selected included: a click on a queue entry never pulls the GM out of the log.
    setActiveTab((tab) => (tab === 'add' ? 'actions' : tab));
  };

  return {
    selectedIds: shownIds.filter((id) => selection.ids.includes(id)),
    activeTab,
    select,
    setActiveTab,
  };
};
