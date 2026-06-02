import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';

import './ImagePlaceholderFrame.css';

type Props = React.ComponentProps<typeof GlassPanel> & {
  dimensions: {
    width: number;
    height: number;
  };
};

export const ImagePlaceholderFrame = ({
  className,
  children,
  dimensions,
  ...props
}: Props) => {
  const { width, height } = dimensions;

  return (
    <GlassPanel
      style={{ width, height }}
      intensity='bright'
      className={cn('image-placeholder-frame', className)}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default ImagePlaceholderFrame;
