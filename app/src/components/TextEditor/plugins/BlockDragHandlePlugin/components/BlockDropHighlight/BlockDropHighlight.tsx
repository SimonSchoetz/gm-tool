import { FCProps } from '@/types';
import './BlockDropHighlight.css';

type Props = {
  top: number | null;
  height: number | null;
};

export const BlockDropHighlight: FCProps<Props> = ({ top, height }) => {
  if (top === null || height === null) return null;

  return (
    <div
      className='block-drop-highlight'
      style={
        {
          '--block-drop-highlight-top': `${top}px`,
          '--block-drop-highlight-height': `${height}px`,
        } as React.CSSProperties
      }
    />
  );
};
