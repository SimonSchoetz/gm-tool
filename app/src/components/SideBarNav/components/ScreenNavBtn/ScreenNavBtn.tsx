import { GlassPanel } from '@/components';
import { Chevron } from '@/components/icons';
import { Routes } from '@/routes';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import { Link, useRouterState } from '@tanstack/react-router';
import '../NavButton.css';
import './ScreenNavBtn.css';

type Props = {
  label: string;
  targetRoute: Routes | string;
  isDisabled?: boolean;
} & HtmlProps<'a'>;

export const ScreenNavBtn: FCProps<Props> = ({
  label,
  targetRoute,
  isDisabled = false,
  ...props
}) => {
  const location = useRouterState({ select: (s) => s.location });
  const isAtTarget = location.href === targetRoute;

  return (
    <GlassPanel
      intensity='bright'
      radius='xl'
      className={cn(
        'button',
        'nav-button',
        isDisabled && 'disabled',
        isAtTarget && 'active'
      )}
    >
      <Link
        to={targetRoute}
        aria-disabled={isDisabled || isAtTarget}
        aria-label={`Navigate to ${label}`}
        className={cn('screen-nav-btn-content', 'content-center')}
        {...props}
      >
        <Chevron direction='left' className={cn(isAtTarget && 'active')} />
        <span>{label}</span>
        <div></div>
      </Link>
    </GlassPanel>
  );
};
