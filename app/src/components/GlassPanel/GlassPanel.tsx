import LightSource from '../LightSource/LightSource';
import { HtmlProps } from '@/types';
import { cn } from '@/util';
import './GlassPanel.css';

type GlassPanelProps = {
  intensity?: 'dim' | 'bright';
} & HtmlProps<'div'>;

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
