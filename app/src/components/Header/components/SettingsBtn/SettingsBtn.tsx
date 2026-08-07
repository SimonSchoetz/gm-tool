import { FCProps } from '@/types';
import './SettingsBtn.css';
import { SettingsIcon } from 'lucide-react';
import { Link, useMatch } from '@tanstack/react-router';

type Props = object;

export const SettingsBtn: FCProps<Props> = () => {
  const isAtTarget = !!useMatch({ from: '/settings', shouldThrow: false });

  return (
    <Link
      to={'/settings'}
      aria-disabled={isAtTarget}
      aria-label={`Navigate to Settings`}
    >
      <SettingsIcon />
    </Link>
  );
};
