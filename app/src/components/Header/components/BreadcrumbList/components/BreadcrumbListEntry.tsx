import { Link } from '@tanstack/react-router';
import { JSX } from 'react/jsx-runtime';
import { ChevronRightIcon } from 'lucide-react';
import { FCProps } from '@/types';
import type { BreadcrumbConfig } from '../../../helper';
import { BreadcrumbListItem } from './BreadcrumbListItem';
import { AdventureCrumb } from './AdventureCrumb';
import { SessionCrumb } from './SessionCrumb';
import { EncounterCrumb } from './EncounterCrumb';
import { BaseEntityCrumb } from './BaseEntityCrumb';

type Props = { config: BreadcrumbConfig; isFirst: boolean };

export const BreadcrumbListEntry: FCProps<Props> = ({ config, isFirst }) => {
  let listItem: JSX.Element;

  if (config.kind === 'static') {
    listItem = (
      <BreadcrumbListItem>
        <Link to={config.to} params={config.params}>
          {config.label}
        </Link>
      </BreadcrumbListItem>
    );
  } else {
    let crumb: JSX.Element;

    switch (config.kind) {
      case 'adventures':
        crumb = <AdventureCrumb />;
        break;
      case 'sessions':
        crumb = <SessionCrumb />;
        break;
      case 'encounters':
        crumb = <EncounterCrumb />;
        break;
      case 'npcs':
      case 'foes':
      case 'items':
      case 'factions':
      case 'pcs':
      case 'locations':
        crumb = <BaseEntityCrumb entityType={config.kind} />;
        break;
    }

    listItem = <BreadcrumbListItem>{crumb}</BreadcrumbListItem>;
  }

  return (
    <>
      {!isFirst && <ChevronRightIcon width={'var(--font-size-lg)'} />}
      {listItem}
    </>
  );
};
