import { AnyRouteMatch, useMatches } from '@tanstack/react-router';
import { FCProps, HtmlProps } from '@/types';
import { buildBreadcrumbs } from '../../helper';
import { BreadcrumbListEntry } from './components';
import './BreadcrumbList.css';

type BreadcrumbListProps = HtmlProps<'nav'>;

export const BreadcrumbList: FCProps<BreadcrumbListProps> = ({ ...props }) => {
  const matches = useMatches();
  const crumbs = buildBreadcrumbs(matches as AnyRouteMatch[]);

  if (crumbs.length === 0) return <nav {...props} />;

  return (
    <nav {...props}>
      <ol className='breadcrumb-list'>
        {crumbs.map((config, index) => (
          <BreadcrumbListEntry
            key={
              config.kind === 'static'
                ? `${String(index)}-static-${config.to}`
                : `${String(index)}-${config.kind}`
            }
            config={config}
            isFirst={index === 0}
          />
        ))}
      </ol>
    </nav>
  );
};
