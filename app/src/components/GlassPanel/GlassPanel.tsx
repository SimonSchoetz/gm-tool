import LightSource from '../LightSource/LightSource';
import { DivProps } from '@/types/htmlProps';
import { cn } from '@/util';
import './GlassPanel.css';

type GlassPanelProps = {
  intensity?: 'dim' | 'bright';
} & DivProps;

const GlassPanel = ({
  className = '',
  children,
  intensity = 'dim',
  ...props
}: GlassPanelProps) => {
  return (
    <div className={cn('glass-panel', 'glass-fx', className)} {...props}>
      <LightSource intensity={intensity} />
      {children}
    </div>
  );
};

export default GlassPanel;
