import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { FCProps, HtmlProps } from '@/types';

import { useRouter } from '@tanstack/react-router';
import './FwBwNav.css';
import { ClickableIcon } from '@/components/ClickableIcon';
type Props = HtmlProps<'div'>;

export const FwBwNav: FCProps<Props> = () => {
  const router = useRouter();
  const canGoBack = router.history.location.state.key !== undefined;
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
    <div className='fw-bw-btn-container'>
      <ClickableIcon
        label='Backward'
        icon={<ChevronLeftIcon />}
        onClick={handleBack}
        disabled={!canGoBack}
      />
      <ClickableIcon
        label='Forward'
        icon={<ChevronRightIcon />}
        onClick={handleForward}
        disabled={!canGoForward}
      />
    </div>
  );
};
