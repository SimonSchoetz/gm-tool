import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { FCProps, HtmlProps } from '@/types';

import { useRouter } from '@tanstack/react-router';
import './FwBwNav.css';
import { ClickableIcon } from '@/components/ClickableIcon';
import { useEffect, useRef, useState } from 'react';
type Props = HtmlProps<'div'>;

export const FwBwNav: FCProps<Props> = () => {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(() => router.history.canGoBack());
  const [canGoForward, setCanGoForward] = useState(false);

  const maxIndexReachedRef = useRef(router.history.location.state.__TSR_index);

  useEffect(() => {
    const unsubscribe = router.history.subscribe(({ location, action }) => {
      setCanGoBack(router.history.canGoBack());

      const currentIndex = location.state.__TSR_index;

      maxIndexReachedRef.current =
        action.type === 'PUSH'
          ? currentIndex
          : Math.max(maxIndexReachedRef.current, currentIndex);
      setCanGoForward(currentIndex < maxIndexReachedRef.current);
    });

    return unsubscribe;
  }, [router.history]);

  const handleBack = () => {
    if (canGoBack) router.history.back();
  };

  const handleForward = () => {
    if (canGoForward) router.history.forward();
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
