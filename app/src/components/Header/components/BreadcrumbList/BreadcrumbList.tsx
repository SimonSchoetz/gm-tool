import { AnyRouteMatch, Link, useMatches } from '@tanstack/react-router';
import { FCProps, HtmlProps } from '@/types';
import { buildBreadcrumbs, BreadcrumbConfig } from '../../helper';
import { AdventureCrumb, SessionCrumb, NpcCrumb } from './components';
import './BreadcrumbList.css';

type BreadcrumbListProps = HtmlProps<'nav'>;

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
