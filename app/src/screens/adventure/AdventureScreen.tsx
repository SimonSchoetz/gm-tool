import { FCProps } from '@/types';
import './AdventureScreen.css';

type Props = object;

export const AdventureScreen: FCProps<Props> = ({ ...props }) => {
  return <div {...props}>AdventureScreen</div>;
};
