import { FCProps } from '@/types/fcProps.type';
import './BlockDropHighlight.css';

type Props = {
  top: number;
  left: number;
  height: number;
};

export const BlockDropHighlight: FCProps<Props> = ({ top, left, height }) => {
  return (
    <div
      className='block-drop-highlight'
      style={
        {
          '--block-drop-highlight-top': `${top}px`,
          '--block-drop-highlight-left': `${left}px`,
          '--block-drop-highlight-height': `${height}px`,
        } as React.CSSProperties
      }
    />
  );
};
