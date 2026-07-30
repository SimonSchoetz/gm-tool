import { AnyRouteMatch, Link, useMatches } from '@tanstack/react-router';
import { FCProps, HtmlProps } from '@/types';
import { buildBreadcrumbs, BreadcrumbConfig } from '../../helper';
import {
  AdventureCrumb,
  SessionCrumb,
  NpcCrumb,
  FoeCrumb,
  ItemCrumb,
  FactionCrumb,
  PcCrumb,
  LocationCrumb,
} from './components';
import './BreadcrumbList.css';
import { JSX } from 'react/jsx-runtime';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '@/util';

type BreadcrumbListProps = HtmlProps<'nav'>;

const BreadCrumbListItem: FCProps<HtmlProps<'li'>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <li className={cn(className, 'clip-text')} {...props}>
      {children}
    </li>
  );
};

const renderCrumb = (item: BreadcrumbConfig, index: number) => {
  let listItem: JSX.Element;

  if (item.kind === 'static') {
    listItem = (
      <BreadCrumbListItem key={`${index}-${item.kind}-${item.to}`}>
        <Link to={item.to} params={item.params}>
          {item.label}
        </Link>
      </BreadCrumbListItem>
    );
  } else {
    let crumb: JSX.Element;

    switch (item.kind) {
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

    listItem = (
      <BreadCrumbListItem key={`${index}-${item.kind}`}>
        {crumb}
      </BreadCrumbListItem>
    );
  }

  return (
    <>
      {index !== 0 && <ChevronRightIcon />} {listItem}
    </>
  );
};

export const BreadcrumbList: FCProps<BreadcrumbListProps> = ({ ...props }) => {
  const matches = useMatches();
  const crumbs = buildBreadcrumbs(matches as AnyRouteMatch[]);

  if (crumbs.length === 0) return <nav {...props} />;

  return (
    <nav {...props}>
      <ol className='breadcrumb-list'>{crumbs.map(renderCrumb)}</ol>
    </nav>
  );
};
