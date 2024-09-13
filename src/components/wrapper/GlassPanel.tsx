import { PropsWithChildren } from 'react';
import { LightSource } from '../animations';

const GlassPanel: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className='glass-fx p-8 pb-12'>
      {children}
      <LightSource intensity='dim' />
    </div>
  );
};

export default GlassPanel;
