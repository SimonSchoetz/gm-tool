import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useRef, useState, useEffect } from 'react';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
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

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const selectionRangeRef = useRef<Range | null>(null);
  const isMouseDownRef = useRef(false);

  const [linkInputEnabled, setLinkInputEnabled] = useState(false);
  const linkInputEnabledRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkInitialUrl, setLinkInitialUrl] = useState('');

  const handleLinkBtnClick = () => {
    if (linkInputEnabled) {
      linkInputEnabledRef.current = false;
      setLinkInputEnabled(false);
      setLinkUrl('');
      setLinkInitialUrl('');
      if (linkInitialUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    } else {
      linkInputEnabledRef.current = true;
      setLinkInputEnabled(true);
    }
  };

  const handleLinkApply = () => {
    const trimmed = linkUrl.trim();
    if (trimmed !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
      setLinkInitialUrl(linkUrl);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      linkInputEnabledRef.current = false;
      setLinkInputEnabled(false);
      setLinkUrl('');
      setLinkInitialUrl('');
    }
  };

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const updateToolbarVisibility = () => {
      if (linkInputEnabledRef.current) return;
      const nativeSelection = window.getSelection();
      if (
        nativeSelection &&
        nativeSelection.rangeCount > 0 &&
        !nativeSelection.isCollapsed
      ) {
        selectionRangeRef.current = nativeSelection.getRangeAt(0);
        const existingUrl = editor.getEditorState().read(getSelectionLinkUrl);
        const hasLink = existingUrl !== null;
        linkInputEnabledRef.current = hasLink;
        setLinkInputEnabled(hasLink);
        setLinkUrl(existingUrl ?? '');
        setLinkInitialUrl(existingUrl ?? '');
        setIsOpen(true);
      } else {
        selectionRangeRef.current = null;
        setIsOpen(false);
      }
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      updateToolbarVisibility();
    };

    rootElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    const unregisterSelectionChange = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (isMouseDownRef.current) return false;
        updateToolbarVisibility();
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
      onClickOutside={() => { setIsOpen(false); }}
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
          <LinkInput
            value={linkUrl}
            onChange={setLinkUrl}
            disabled={!linkInputEnabled}
            isApplyEnabled={linkUrl !== linkInitialUrl}
            onApply={handleLinkApply}
          />
        </div>
      </div>
    </EditorPopup>
  );
};
