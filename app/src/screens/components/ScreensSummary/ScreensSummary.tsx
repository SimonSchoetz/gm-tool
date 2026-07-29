import { FCProps } from '@/types';
import './ScreensSummary.css';
import { ComponentProps, JSX } from 'react';
import { GlassPanel, CustomScrollArea } from '@/components';

type Props = ComponentProps<typeof GlassPanel> & { body: JSX.Element };

export const ScreensSummary: FCProps<Props> = ({ body }) => {
  return (
    <GlassPanel className='screens-summary' intensity='bright'>
      <CustomScrollArea>{body}</CustomScrollArea>
    </GlassPanel>
  );
};
