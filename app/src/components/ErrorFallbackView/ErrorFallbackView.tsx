import { FCProps } from '@/types/fcProps.type';
import './ErrorFallbackView.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { Button } from '../Button/Button';

type Props = {
  errorMessage: string;
  errorStack: string | null;
  onReset: () => void;
};

export const ErrorFallbackView: FCProps<Props> = ({
  errorMessage,
  errorStack,
  onReset,
}) => {
  const isDevelopment = import.meta.env.DEV;

  const onGoHome = () => {
    window.location.href = '/';
  };

  return (
    <GlassPanel className='error-fallback-view-panel' intensity='bright'>
      <h1 className='error-fallback-view-title'>Something went wrong</h1>

      <p className='error-fallback-view-message'>{errorMessage}</p>

      {isDevelopment && errorStack && (
        <div className='error-fallback-view-details-frame'>
          <details className='error-fallback-view-details scroll-edge-fade scroll-edge-fade--sm scroll-edge-fade--own-padding'>
            <summary>Stack trace</summary>
            <pre className='error-fallback-view-stack'>{errorStack}</pre>
          </details>
        </div>
      )}

      <div className='error-fallback-view-actions'>
        <Button label='Try again' onClick={onReset} />
        <Button label='Go home' onClick={onGoHome} />
      </div>
    </GlassPanel>
  );
};
