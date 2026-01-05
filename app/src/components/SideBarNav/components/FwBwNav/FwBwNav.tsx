import { ActionContainer, GlassPanel } from '@/components';
import { Chevron } from '@/components/icons';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import { useRouter } from '@tanstack/react-router';
import './FwBwNav.css';

type Props = HtmlProps<'div'>;

export const FwBwNav: FCProps<Props> = () => {
  const router = useRouter();
  const canGoBack = router.history.location.state?.key !== undefined;
  const canGoForward = window.history.length > 1;

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    }
  };

  const handleForward = () => {
    console.log('handleForward');
    if (canGoForward) {
      console.log('forward');
      router.history.forward();
    }
  };
  return (
    <div className='fw-bw-btn-container'>
      <ActionContainer onClick={handleBack} aria-disabled={!canGoBack}>
        <GlassPanel
          intensity='bright'
          className={cn(
            'fw-bw-btn',
            'content-center',
            !canGoBack && 'disabled'
          )}
        >
          <Chevron direction='left' />
        </GlassPanel>
      </ActionContainer>

      <ActionContainer
        onClick={handleForward}
        aria-disabled={!canGoForward}
        className={cn('content-center', !canGoForward && 'disabled')}
      >
        <GlassPanel
          intensity='bright'
          className={cn('fw-bw-btn', 'content-center')}
        >
          <Chevron direction='right' />
        </GlassPanel>
      </ActionContainer>
    </div>
  );
};
