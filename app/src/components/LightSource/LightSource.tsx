import { HtmlProps } from '@/types/htmlProps.type';
import './LightSource.css';
import { cn } from '@/util/className';
import { getIntensityClass } from './helper/getIntensityClass';

type LightSourceProps = {
  intensity: 'bright' | 'dim' | 'off';
} & HtmlProps<'div'>;

const LightSource = ({
  intensity,
  className = '',
  ...props
}: Readonly<LightSourceProps>) => {
  if (intensity === 'off') return <></>;

  const intensityClass = getIntensityClass(intensity);

  return (
    <div
      className={cn('light-source', intensityClass, className)}
      {...props}
    ></div>
  );
};

export default LightSource;
