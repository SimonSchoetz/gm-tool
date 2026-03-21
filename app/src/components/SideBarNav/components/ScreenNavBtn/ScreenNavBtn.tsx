import { GlassPanel } from '@/components';
import type { AppRoute } from '@/types';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import { Link, useMatch } from '@tanstack/react-router';
import '../NavButton.css';
import './ScreenNavBtn.css';
import { ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

type Props = {
  label: string;
  to: AppRoute;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  isDisabled?: boolean;
} & HtmlProps<'a'>;

export const ScreenNavBtn: FCProps<Props> = ({
  label,
  to,
  params,
  searchParams,
  isDisabled = false,
  ...props
}) => {
  // shouldThrow: false is required — omitting it causes a runtime error when the route is not active
  const isAtTarget = !!useMatch({ from: to, shouldThrow: false });

  return (
    <GlassPanel
      intensity='bright'
      radius='xl'
      className={cn(
        'button',
        'nav-button',
        isDisabled && 'disabled',
        isAtTarget && 'active',
      )}
    >
      <Link
        to={to}
        params={params}
        search={searchParams}
        disabled={isDisabled}
        aria-disabled={isDisabled || isAtTarget}
        aria-label={`Navigate to ${label}`}
        className={cn('screen-nav-btn-content', 'content-center')}
        {...props}
      >
        <ChevronsLeftIcon className={cn(isAtTarget && 'active')} />
        <span>{label}</span>
        <ChevronsRightIcon className={cn(isAtTarget && 'active')} />
      </Link>
    </GlassPanel>
  );
};
