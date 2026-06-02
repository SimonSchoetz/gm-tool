import GlassPanel from '../../../GlassPanel/GlassPanel';
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
  isDisabled?: boolean;
  configColor?: string;
};

export const ScreenNavBtn: FCProps<Props> = ({
  label,
  to,
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
          '--rt-screen-nav-btn-color': configColor ?? 'var(--color-fg-rgb)',
        } as CSSProperties
      }
    >
      <Link
        to={to}
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
