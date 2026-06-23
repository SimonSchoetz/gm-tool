import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useRef, useState, useEffect } from 'react';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, $getSelection, $isRangeSelection } from 'lexical';
import './FloatingToolbar.css';
import {
  TextFormatBtn,
  HeadingBtn,
  ListBtn,
  LinkBtn,
  LinkInput,
  Divider,
} from './components';
import { textFormatBtns, headingBtns, listBtns } from './toolbarConfig';
import { EditorPopup } from '../EditorPopup';
import { getSelectionLinkUrl } from './helper';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const selectionRangeRef = useRef<Range | null>(null);
  const isMouseDownRef = useRef(false);
  // True only when the user has explicitly clicked LinkBtn to enter link-edit mode.
  // Does NOT become true merely because the selection contains a link.
  const isLinkEditingRef = useRef(false);

  const [linkInputEnabled, setLinkInputEnabled] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkInitialUrl, setLinkInitialUrl] = useState('');

  const handleLinkBtnClick = () => {
    if (linkInputEnabled) {
      isLinkEditingRef.current = false;
      setLinkInputEnabled(false);
      setLinkUrl('');
      setLinkInitialUrl('');
      if (linkInitialUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    } else {
      isLinkEditingRef.current = true;
      setLinkInputEnabled(true);
    }
  };

  const handleLinkApply = () => {
    const trimmed = linkUrl.trim();
    if (trimmed !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
      setLinkInitialUrl(linkUrl);
      // Exit link-edit mode so the next SELECTION_CHANGE_COMMAND re-reads the
      // updated link URL from Lexical and reflects it in the input.
      isLinkEditingRef.current = false;
      // Lexical reconciles the DOM synchronously on dispatchCommand.
      // The old Range in selectionRangeRef pointed to text nodes that no longer
      // exist after link creation. Refresh from the now-valid native selection.
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        selectionRangeRef.current = nativeSelection.getRangeAt(0);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      isLinkEditingRef.current = false;
      setLinkInputEnabled(false);
      setLinkUrl('');
      setLinkInitialUrl('');
    }
  };

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // allowClose: whether this call is permitted to close the toolbar when the
    // Lexical selection is empty. True only for handleMouseUp originating in the
    // editor — that is the only gesture that represents deliberate deselection.
    // SELECTION_CHANGE_COMMAND fires for format operations (node restructuring)
    // where the selection is transiently null; it must never close the toolbar.
    const updateToolbarVisibility = (allowClose: boolean) => {
      const lexicalHasSelection = editor.getEditorState().read(() => {
        const sel = $getSelection();
        return $isRangeSelection(sel) && !sel.isCollapsed();
      });

      if (!lexicalHasSelection) {
        if (allowClose && !isLinkEditingRef.current) {
          selectionRangeRef.current = null;
          setIsOpen(false);
        }
        return;
      }

      // Always refresh the anchor position when native selection is valid.
      // This must not be guarded by isLinkEditingRef — format operations restructure
      // DOM nodes, making any stored Range stale, and the position must update.
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0 && !nativeSelection.isCollapsed) {
        selectionRangeRef.current = nativeSelection.getRangeAt(0);
      }

      // Only derive link state from the selection when not in explicit link-edit mode.
      // In link-edit mode, the user controls linkUrl/linkInitialUrl directly.
      if (!isLinkEditingRef.current) {
        const existingUrl = editor.getEditorState().read(getSelectionLinkUrl);
        const hasLink = existingUrl !== null;
        setLinkInputEnabled(hasLink);
        setLinkUrl(existingUrl ?? '');
        setLinkInitialUrl(existingUrl ?? '');
      }

      setIsOpen(true);
    };

    const handleMouseDown = () => { isMouseDownRef.current = true; };
    const handleMouseUp = () => {
      // Capture before resetting: true means the drag originated in the editor.
      const wasInEditor = isMouseDownRef.current;
      isMouseDownRef.current = false;
      updateToolbarVisibility(wasInEditor);
    };

    rootElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    const unregisterSelectionChange = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (isMouseDownRef.current) return false;
        // Never close from SELECTION_CHANGE_COMMAND — it fires transiently during
        // node restructuring (format toggles, heading changes) with an empty
        // selection even though the user has not deselected.
        updateToolbarVisibility(false);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      rootElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      unregisterSelectionChange();
    };
  }, [editor]);

  if (!isOpen) return null;

  return (
    <EditorPopup
      getAnchorRect={() => selectionRangeRef.current?.getBoundingClientRect() ?? null}
      onClickOutside={() => {
        // When the user starts a drag selection in the editor, the mousedown lands
        // outside the popup (the editor is not inside the popup DOM node), which
        // would trigger onClickOutside and close the toolbar before the drag
        // completes. Skip the close: handleMouseUp will reopen after the drag if
        // text was selected, or close if the mouse was just clicked (no selection).
        if (isMouseDownRef.current) return;
        isLinkEditingRef.current = false;
        setLinkInputEnabled(false);
        setLinkUrl('');
        setLinkInitialUrl('');
        setIsOpen(false);
      }}
    >
      <div className='floating-toolbar'>
        <div
          className='floating-toolbar-buttons'
          onMouseDown={(e) => { e.preventDefault(); }}
        >
          {headingBtns.map((btn) => (
            <HeadingBtn
              key={btn.headingType}
              label={btn.label}
              headingType={btn.headingType}
              icon={btn.icon}
            />
          ))}
          <Divider />
          {textFormatBtns.map((btn) => (
            <TextFormatBtn
              key={btn.formatType}
              label={btn.label}
              formatType={btn.formatType}
              icon={btn.icon}
            />
          ))}
          <Divider />
          {listBtns.map((btn) => (
            <ListBtn
              key={btn.listType}
              label={btn.label}
              listType={btn.listType}
              icon={btn.icon}
            />
          ))}
        </div>
        <div className='floating-toolbar-link-row'>
          <span onMouseDown={(e) => { e.preventDefault(); }}>
            <LinkBtn isActive={linkInputEnabled} onClick={handleLinkBtnClick} />
          </span>
          <GlassPanel
            intensity={linkInputEnabled ? 'bright' : 'dim'}
            className='link-input-container'
          >
            <LinkInput
              value={linkUrl}
              onChange={(url) => { isLinkEditingRef.current = true; setLinkUrl(url); }}
              disabled={!linkInputEnabled}
              isApplyEnabled={linkUrl !== linkInitialUrl}
              onApply={handleLinkApply}
            />
          </GlassPanel>
        </div>
      </div>
    </EditorPopup>
  );
};
