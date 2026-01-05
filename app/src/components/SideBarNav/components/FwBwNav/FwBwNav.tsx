import { ActionContainer, GlassPanel } from '@/components';
import { Chevron } from '@/components/icons';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import { useRouter } from '@tanstack/react-router';
import './FwBwNav.css';
import '../NavButton.css';
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
    if (canGoForward) {
      router.history.forward();
    }
  };

  return (
    <div className='fw-bw-btn-container'>
      <Button
        navAction={handleBack}
        label='Backward'
        chevronDirection='left'
        disabled={!canGoBack}
      />

      <Button
        navAction={handleForward}
        label='Forward'
        chevronDirection='right'
        disabled={!canGoForward}
      />
    </div>
  );
};

const Button = ({
  navAction,
  label,
  chevronDirection,
  disabled,
}: {
  navAction: () => void;
  label: string;
  chevronDirection: 'left' | 'right';
  disabled: boolean;
}) => {
  return (
    <ActionContainer label={label} onClick={navAction} aria-disabled={disabled}>
      <GlassPanel
        intensity='bright'
        radius='xl'
        className={cn(
          'nav-button',
          'fw-bw-btn',
          'content-center',
          disabled && 'disabled'
        )}
      >
        <Chevron direction={chevronDirection} />
      </GlassPanel>
    </ActionContainer>
  );
};
