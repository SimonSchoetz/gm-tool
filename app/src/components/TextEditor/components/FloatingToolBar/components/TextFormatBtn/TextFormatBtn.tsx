import { ActionContainer, GlassPanel } from '@/components';
import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { LucideIcon } from 'lucide-react';
import './TextFormatBtn.css';
import { cn } from '@/util';

type TextFormatBtnProps = {
  label: string;
  formatType: TextFormatType;
  isActive: boolean;
  icon: LucideIcon;
};

export const TextFormatBtn: FCProps<TextFormatBtnProps> = ({
  label,
  formatType,
  isActive,
  icon: Icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();

  const handleFormat = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return (
    <GlassPanel
      data-active={isActive}
      radius='md'
      intensity={isActive ? 'bright' : 'off'}
      className={cn('button', isActive && 'active')}
    >
      <ActionContainer
        className='text-format-btn'
        label={label}
        onClick={handleFormat}
        {...props}
      >
        <Icon size={'var(--font-size-base)'} />
      </ActionContainer>
    </GlassPanel>
  );
};
