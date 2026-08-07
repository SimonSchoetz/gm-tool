import { Link } from '@tanstack/react-router';
import { JSX } from 'react/jsx-runtime';
import { ChevronRightIcon } from 'lucide-react';
import { FCProps } from '@/types';
import type { BreadcrumbConfig } from '../../../helper';
import { BreadcrumbListItem } from './BreadcrumbListItem';
import { AdventureCrumb } from './AdventureCrumb';
import { SessionCrumb } from './SessionCrumb';
import { NpcCrumb } from './NpcCrumb';
import { FoeCrumb } from './FoeCrumb';
import { ItemCrumb } from './ItemCrumb';
import { FactionCrumb } from './FactionCrumb';
import { PcCrumb } from './PcCrumb';
import { LocationCrumb } from './LocationCrumb';

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
      case 'npcs':
        crumb = <NpcCrumb />;
        break;
      case 'foes':
        crumb = <FoeCrumb />;
        break;
      case 'items':
        crumb = <ItemCrumb />;
        break;
      case 'factions':
        crumb = <FactionCrumb />;
        break;
      case 'pcs':
        crumb = <PcCrumb />;
        break;
      case 'locations':
        crumb = <LocationCrumb />;
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
