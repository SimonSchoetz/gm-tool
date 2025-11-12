import LightSource from '../LightSource/LightSource';
import './GlassPanel.css';
import { DivProps } from '@/types/htmlProps';

const GlassPanel = ({ className = '', children, ...props }: DivProps) => {
  const classNames = ['glass-panel', 'glass-fx', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${classNames}`} {...props}>
      <LightSource intensity='dim' />
      {children}
    </div>
  );
};

export default GlassPanel;
