import { AnyRouteMatch, Link, useMatches } from '@tanstack/react-router';
import { FCProps, HtmlProps } from '@/types';
import { buildBreadcrumbs, BreadcrumbConfig } from '../../helper';
import { AdventureCrumb, SessionCrumb, NpcCrumb } from './components';
import './BreadcrumbList.css';
import { JSX } from 'react/jsx-runtime';
import { ChevronRightIcon } from 'lucide-react';

type BreadcrumbListProps = HtmlProps<'nav'>;

const renderCrumb = (item: BreadcrumbConfig, index: number) => {
  let listItem: JSX.Element;

  switch (item.kind) {
    case 'static':
      listItem = (
        <li key={`${index}-${item.kind}-${item.to}`}>
          <Link to={item.to} params={item.params}>
            {item.label}
          </Link>
        </li>
      );
      break;
    case 'adventure':
      listItem = (
        <li key={`${index}-${item.kind}`}>
          <AdventureCrumb />
        </li>
      );
      break;
    case 'session':
      listItem = (
        <li key={`${index}-${item.kind}`}>
          <SessionCrumb />
        </li>
      );
      break;
    case 'npc':
      listItem = (
        <li key={`${index}-${item.kind}`}>
          <NpcCrumb />
        </li>
      );
      break;
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
