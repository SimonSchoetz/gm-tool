import { useTableConfigs } from '@/data-access-layer';
import { CustomScrollArea } from '@/components';
import { ListConfigRow } from './components';

import './ListConfigSection.css';

export const ListConfigSection = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <section>
      <h2 className='list-config-section-heading'>List Configuration</h2>
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
