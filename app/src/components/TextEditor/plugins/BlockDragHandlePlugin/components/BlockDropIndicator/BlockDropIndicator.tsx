import { FCProps } from '@/types';
import './BlockDropIndicator.css';

type Props = {
  ref: React.Ref<HTMLDivElement>;
};

export const BlockDropIndicator: FCProps<Props> = ({ ref }) => (
  <div ref={ref} className='block-drop-indicator' />
);
