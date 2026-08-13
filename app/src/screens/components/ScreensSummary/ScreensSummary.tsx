import { FCProps } from '@/types';
import './ScreensSummary.css';
import { ComponentProps } from 'react';
import { GlassPanel } from '@/components';

type Props = ComponentProps<typeof GlassPanel>;

export const ScreensSummary: FCProps<Props> = ({ children }) => {
  return (
    <GlassPanel className='screens-summary' intensity='bright'>
      <div className='screens-summary--content'>{children}</div>
    </GlassPanel>
  );
};
