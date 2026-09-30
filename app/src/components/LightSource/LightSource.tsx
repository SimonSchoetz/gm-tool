import { HtmlProps } from '@/types/htmlProps.type';
import './LightSource.css';
import { cn } from '@/util/className';

type LightSourceProps = {
  intensity: 'bright' | 'dim' | 'off';
} & HtmlProps<'div'>;

const LightSource = ({
  intensity,
  className = '',
  ...props
}: Readonly<LightSourceProps>) => {
  const intensityClass =
    intensity === 'bright' ? 'light-source-bright' : 'light-source-dim';

  if (intensity === 'off') return <></>;

  return (
    <div
      className={cn('light-source', intensityClass, className)}
      {...props}
    ></div>
  );
};

export default LightSource;
