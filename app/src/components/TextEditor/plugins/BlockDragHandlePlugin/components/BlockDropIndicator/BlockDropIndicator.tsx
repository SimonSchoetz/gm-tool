import { FCProps } from '@/types/fcProps.type';
import './BlockDropIndicator.css';
import { SquareArrowRightEnterIcon } from 'lucide-react';

type Props = {
  top: number;
};

export const BlockDropIndicator: FCProps<Props> = ({ top }) => {
  const positionStyle = {
    '--block-drop-indicator-top': `${top}px`,
  } as React.CSSProperties;

  return (
    <div className='block-drop-indicator' style={positionStyle}>
      <SquareArrowRightEnterIcon />
    </div>
  );
};
