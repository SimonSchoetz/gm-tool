import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { LinkBtn, LinkInput } from './components';
import './LinkRow.css';
import { useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const LinkRow = () => {
  const [editor] = useLexicalComposerContext();
  // True only when the user clicked LinkBtn, not merely because the selection contains a link.
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
      isLinkEditingRef.current = false;
      // After link creation the old Range points to nodes that no longer exist — refresh.
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
  return (
    <div className='floating-toolbar-link-row'>
      <span
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <LinkBtn isActive={linkInputEnabled} onClick={handleLinkBtnClick} />
      </span>
      <GlassPanel
        intensity={linkInputEnabled ? 'bright' : 'dim'}
        className='link-input-container'
      >
        <LinkInput
          value={linkUrl}
          onChange={(url) => {
            isLinkEditingRef.current = true;
            setLinkUrl(url);
          }}
          disabled={!linkInputEnabled}
          isApplyEnabled={linkUrl !== linkInitialUrl}
          onApply={handleLinkApply}
        />
      </GlassPanel>
    </div>
  );
};
