import { GlassPanel } from '@/components';
import { Routes } from '@/routes';
import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import { Link, useRouterState } from '@tanstack/react-router';
import '../NavButton.css';
import './ScreenNavBtn.css';
import { ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

type Props = {
  label: string;
  targetRoute: Routes | string;
  searchParams?: Record<string, string>;
  isDisabled?: boolean;
} & HtmlProps<'a'>;

export const ScreenNavBtn: FCProps<Props> = ({
  label,
  targetRoute,
  searchParams,
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
        isAtTarget && 'active',
      )}
    >
      <Link
        to={targetRoute}
        search={searchParams}
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
