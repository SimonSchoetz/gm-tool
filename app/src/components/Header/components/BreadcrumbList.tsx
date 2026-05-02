import { AnyRouteMatch, Link, useMatches } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { buildBreadcrumbs, BreadcrumbConfig } from '../helper';
import { AdventureCrumb } from './AdventureCrumb';
import { SessionCrumb } from './SessionCrumb';
import { NpcCrumb } from './NpcCrumb';
import './BreadcrumbList.css';

type Props = Record<string, never>;

const renderCrumb = (item: BreadcrumbConfig, index: number) => {
  switch (item.kind) {
    case 'static':
      return (
        <li
          key={`${index}-${item.kind}-${item.to}`}
          className='breadcrumb-item'
        >
          <Link to={item.to} params={item.params}>
            {item.label}
          </Link>
        </li>
      );
    case 'adventure':
      return (
        <li key={`${index}-${item.kind}`} className='breadcrumb-item'>
          <AdventureCrumb />
        </li>
      );
    case 'session':
      return (
        <li key={`${index}-${item.kind}`} className='breadcrumb-item'>
          <SessionCrumb />
        </li>
      );
    case 'npc':
      return (
        <li key={`${index}-${item.kind}`} className='breadcrumb-item'>
          <NpcCrumb />
        </li>
      );
  }
};

export const BreadcrumbList: FCProps<Props> = () => {
  const matches = useMatches();
  const crumbs = buildBreadcrumbs(matches as AnyRouteMatch[]);

  if (crumbs.length === 0) return <nav />;

  return (
    <nav>
      <ol className='breadcrumb-list'>{crumbs.map(renderCrumb)}</ol>
    </nav>
  );
};
