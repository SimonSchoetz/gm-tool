import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import { ActionContainer } from '../ActionContainer/ActionContainer';
import './UpDownBtns.css';

type Props = {
  upLabel: string;
  downLabel: string;
  isUpDisabled: boolean;
  isDownDisabled: boolean;
  onUp: () => void;
  onDown: () => void;
};

export const UpDownBtns: FCProps<Props> = ({
  upLabel,
  downLabel,
  isUpDisabled,
  isDownDisabled,
  onUp,
  onDown,
}) => {
  return (
    <div className='up-down-btns'>
      <ActionContainer
        className='up-down-btns-btn'
        disabled={isUpDisabled}
        title={upLabel}
        label={upLabel}
        onClick={onUp}
      >
        <ChevronUpIcon />
      </ActionContainer>

      <ActionContainer
        className='up-down-btns-btn'
        disabled={isDownDisabled}
        title={downLabel}
        label={downLabel}
        onClick={onDown}
      >
        <ChevronDownIcon />
      </ActionContainer>
    </div>
  );
};
