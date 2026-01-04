import { FCProps } from '@/types';
import { Glare, Shimmer } from './components';

type Props = {
  shimmerContent?: string;
};

export const HoloFX: FCProps<Props> = ({ shimmerContent }) => {
  return (
    <>
      <Glare />
      <Shimmer shimmerContent={shimmerContent} />
    </>
  );
};
