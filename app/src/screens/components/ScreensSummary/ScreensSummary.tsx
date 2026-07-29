import { FCProps } from '@/types';
import './ScreensSummary.css';
import { ComponentProps } from 'react';
import { GlassPanel, CustomScrollArea } from '@/components';

type Props = ComponentProps<typeof GlassPanel>;

export const ScreensSummary: FCProps<Props> = ({ children }) => {
  return (
    <GlassPanel className='screens-summary' intensity='bright'>
      <CustomScrollArea>{children}</CustomScrollArea>
    </GlassPanel>
  );
};
