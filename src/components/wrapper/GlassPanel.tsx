import { PropsWithChildren } from 'react';
import { LightSource } from '../animations';
import { DivProps, FCProps } from '@/types/app';

const GlassPanel: FCProps<PropsWithChildren<DivProps>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div {...props} className={`glass-fx p-8 pb-12 ${className}`}>
      {children}
      <LightSource intensity='dim' />
    </div>
  );
};

export default GlassPanel;
