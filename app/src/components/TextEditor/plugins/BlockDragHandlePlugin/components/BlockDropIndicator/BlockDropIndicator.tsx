import { FCProps } from '@/types/fcProps.type';
import './BlockDropIndicator.css';
import { SquareArrowRightEnterIcon } from 'lucide-react';

type Props = {
  top: number;
  left: number;
};

export const BlockDropIndicator: FCProps<Props> = ({ top, left }) => {
  const positionStyle = {
    '--block-drop-indicator-top': `${top}px`,
    '--block-drop-indicator-left': `${left}px`,
  } as React.CSSProperties;

  return (
    <div className='block-drop-indicator' style={positionStyle}>
      <SquareArrowRightEnterIcon />
    </div>
  );
};
