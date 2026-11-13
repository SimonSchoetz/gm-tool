import { FCProps } from '@/types/fcProps.type';
import './BlockDropHighlight.css';

type Props = {
  top: number | null;
  left: number | null;
  height: number | null;
};

export const BlockDropHighlight: FCProps<Props> = ({ top, left, height }) => {
  if (top === null || left === null || height === null) return null;

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
