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
      case 'adventure':
        crumb = <AdventureCrumb />;
        break;
      case 'session':
        crumb = <SessionCrumb />;
        break;
      case 'npc':
        crumb = <NpcCrumb />;
        break;
      case 'foe':
        crumb = <FoeCrumb />;
        break;
      case 'item':
        crumb = <ItemCrumb />;
        break;
      case 'faction':
        crumb = <FactionCrumb />;
        break;
      case 'pc':
        crumb = <PcCrumb />;
        break;
      case 'location':
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
