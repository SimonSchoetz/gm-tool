import { useTableConfigs } from '@/data-access-layer';
import { LoadingIcon } from '@/components';
import { ListConfigRow } from './components';

import './ListConfigSection.css';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';

export const ListConfigSection = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <Section>
      <H2 heading='List Configuration' />
      <ul className='list-config-section-list'>
        {tableConfigs.map((config) => (
          <ListConfigRow key={config.id} listConfigId={config.id} />
        ))}
      </ul>
    </Section>
  );
};
