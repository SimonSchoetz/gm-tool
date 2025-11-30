import LightSource from '../LightSource/LightSource';
import { HtmlProps } from '@/types';
import { cn } from '@/util';
import './GlassPanel.css';

type RadiusSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'none';

type GlassPanelProps = {
  intensity?: React.ComponentProps<typeof LightSource>['intensity'];
  radius?: RadiusSize;
} & HtmlProps<'div'>;

const GlassPanel = ({
  className = '',
  children,
  intensity = 'dim',
  radius = '2xl',
  style,
  ...props
}: GlassPanelProps) => {
  return (
    <div
      className={cn('glass-panel', 'glass-fx', className)}
      style={{
        ...style,
        borderRadius: `var(--radius-${radius})`,
      }}
      {...props}
    >
      <LightSource intensity={intensity} />
      {children}
    </div>
  );
};

export default GlassPanel;
