import { useEffect, useState, type RefObject } from 'react';
import { applySelectionClick } from '../helper/applySelectionClick';
import type {
  SelectionModifiers,
  SelectionState,
} from '../helper/applySelectionClick';
import { isEditableWithin } from '../helper/isEditableWithin';
import { pruneSelection } from '../helper/pruneSelection';

export type SidebarTab = 'add' | 'actions' | 'log';

const EMPTY_SELECTION: SelectionState = {
  // The prune on every render drops an id that is not shown.
  ids: [],
  anchorId: null,
  shownItemId: null,
};

export const useEncounterSelection = (
  encounterId: string,
  shownIds: string[],
  middleColumnRef: RefObject<HTMLElement | null>,
): {
  selectedIds: string[];
  shownItemId: string | null;
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
        if (
          event.key === 'Escape' &&
          // An open modal dialog closes on its own Escape, which must leave the selection alone.
          document.querySelector('[aria-modal="true"]') === null &&
          !isEditableWithin(middleColumnRef.current, event.target)
        ) {
          setSelection(EMPTY_SELECTION);
        }
      };
      document.addEventListener('keydown', clearOnEscape);
      return () => {
        document.removeEventListener('keydown', clearOnEscape);
      };
    },
    // A dependency array holding one ref object never changes between renders, so the effect runs once.
    [middleColumnRef],
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
    shownItemId: pruned.shownItemId,
    activeTab,
    select,
    setActiveTab,
  };
};
