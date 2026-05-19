import { GlassPanel } from '@/components';
import type { FCProps } from '@/types';
import { cn } from '@/util';
import { Link, useMatch } from '@tanstack/react-router';
import '../NavButton.css';
import './ScreenNavBtn.css';
import type { RegisteredRouter } from '@tanstack/react-router';
import type { RouteToPath } from '@tanstack/router-core';
import { CSSProperties } from 'react';

type Props = {
  label: string;
  to: RouteToPath<RegisteredRouter>;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  isDisabled?: boolean;
  configColor?: string;
};

export const ScreenNavBtn: FCProps<Props> = ({
  label,
  to,
  params,
  searchParams,
  isDisabled = false,
  configColor,
}) => {
  // shouldThrow: false is required — omitting it causes a runtime error when the route is not active
  const isAtTarget = !!useMatch({ from: to, shouldThrow: false });

  return (
    <GlassPanel
      intensity='bright'
      className={cn(
        'global-btn-styles',
        'nav-button',
        isDisabled && 'disabled',
        isAtTarget && 'active',
      )}
      style={
        {
          '--domain-color': configColor ?? 'var(--color-fg)',
        } as CSSProperties
      }
    >
      <Link
        to={to}
        {...(params !== undefined ? { params } : {})}
        {...(searchParams !== undefined ? { search: searchParams } : {})}
        disabled={isDisabled}
        aria-disabled={isDisabled || isAtTarget}
        aria-label={`Navigate to ${label}`}
        className={cn('screen-nav-btn-content', 'content-center')}
      >
        <span>{label}</span>
      </Link>
    </GlassPanel>
  );
};
