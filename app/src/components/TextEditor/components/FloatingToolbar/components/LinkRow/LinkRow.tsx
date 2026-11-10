import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { LinkBtn } from './components/LinkBtn/LinkBtn';
import { LinkInput } from './components/LinkInput/LinkInput';
import './LinkRow.css';
import { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getLinkPanelIntensity } from './helper/getLinkPanelIntensity';
import { getSelectionLinkUrl } from './helper/getSelectionLinkUrl';

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

  const onMouseDown = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
  };

  const linkPanelIntensity = getLinkPanelIntensity(linkInputEnabled);

  return (
    <div className='floating-toolbar-link-row'>
      <span onMouseDown={onMouseDown}>
        <LinkBtn isActive={linkInputEnabled} onClick={handleLinkBtnClick} />
      </span>
      <GlassPanel
        intensity={linkPanelIntensity}
        className='link-input-container'
      >
        <LinkInput
          value={linkUrl}
          onChange={setLinkUrl}
          disabled={!linkInputEnabled}
          isApplyEnabled={linkUrl !== linkInitialUrl}
          onApply={handleLinkApply}
        />
      </GlassPanel>
    </div>
  );
};
