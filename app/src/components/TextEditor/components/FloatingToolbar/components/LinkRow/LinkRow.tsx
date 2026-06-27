import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { LinkBtn, LinkInput } from './components';
import './LinkRow.css';
import { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getSelectionLinkUrl } from './helper';

export const LinkRow = () => {
  const [editor] = useLexicalComposerContext();

  const [linkInputEnabled, setLinkInputEnabled] = useState(
    () => editor.getEditorState().read(getSelectionLinkUrl) !== null,
  );
  const [linkUrl, setLinkUrl] = useState(
    () => editor.getEditorState().read(getSelectionLinkUrl) ?? '',
  );
  const [linkInitialUrl, setLinkInitialUrl] = useState(
    () => editor.getEditorState().read(getSelectionLinkUrl) ?? '',
  );

  const handleLinkBtnClick = () => {
    if (linkInputEnabled) {
      setLinkInputEnabled(false);
      setLinkUrl('');
      setLinkInitialUrl('');
      if (linkInitialUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    } else {
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
