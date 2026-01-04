import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import ActionContainer from '../ActionContainer/ActionContainer';
import { useRouter } from '@tanstack/react-router';
import { cn } from '@/util';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  const router = useRouter();
  const canGoBack = router.history.location.state?.key !== undefined;
  const canGoForward = window.history.length > 1;

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      router.history.forward();
    }
  };

  return (
    <aside {...props}>
      <GlassPanel>
        <div className='fw-bw-btn-container'>
          <ActionContainer onClick={handleBack}>
            <GlassPanel
              className={cn(
                'fw-bw-btn',
                'content-center',
                !canGoBack && 'disabled'
              )}
            >
              <span> &larr; </span>
            </GlassPanel>
          </ActionContainer>

          <ActionContainer onClick={handleForward}>
            <GlassPanel
              className={cn(
                'fw-bw-btn',
                'content-center',
                !canGoForward && 'disabled'
              )}
            >
              <span> &rarr; </span>
            </GlassPanel>
          </ActionContainer>
        </div>
      </GlassPanel>
    </aside>
  );
};
