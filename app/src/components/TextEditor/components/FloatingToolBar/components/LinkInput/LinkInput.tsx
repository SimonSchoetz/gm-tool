import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { ActionContainer } from '../../../../../ActionContainer/ActionContainer';
import { GlassPanel } from '../../../../../GlassPanel/GlassPanel';
import { Input } from '../../../../../Input/Input';

import './LinkInput.css';

type Props = {
  onClose: () => void;
};

export const LinkInput: FCProps<Props> = ({ onClose }) => {
  const [editor] = useLexicalComposerContext();
  const [url, setUrl] = useState('');

  const handleApply = () => {
    if (url.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim());
    }
    onClose();
  };

  return (
    <GlassPanel className='link-input'>
      <Input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
        }}
        placeholder='https://...'
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleApply();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
      />
      <ActionContainer label='Apply link' onClick={handleApply}>
        <CheckIcon />
      </ActionContainer>
      <ActionContainer label='Cancel' onClick={onClose}>
        <XIcon />
      </ActionContainer>
    </GlassPanel>
  );
};
