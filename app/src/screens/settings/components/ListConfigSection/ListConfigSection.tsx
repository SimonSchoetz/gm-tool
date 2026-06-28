import { useTableConfigs } from '@/data-access-layer';
import { CustomScrollArea } from '@/components';
import { ListConfigRow } from './components';

import './ListConfigSection.css';
import { H2 } from '../H2/H2';

export const ListConfigSection = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <section>
      <H2 heading='List Configuration' />
      <CustomScrollArea>
        <ul className='list-config-section-list'>
          {tableConfigs.map((config) => (
            <ListConfigRow key={config.id} listConfigId={config.id} />
          ))}
        </ul>
      </CustomScrollArea>
    </section>
  );
};
