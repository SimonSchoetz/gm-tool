import { useTableConfigs } from '@/data-access-layer';
import { CustomScrollArea } from '@/components';
import { TableConfigRow } from '../TableConfigRow/TableConfigRow';
import './TableConfigSection.css';

export const TableConfigSection = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <section className='table-config-section'>
      <h2 className='table-config-section-heading'>Table Configuration</h2>
      <CustomScrollArea>
        <ul className='table-config-section-list'>
          {tableConfigs.map((config) => (
            <TableConfigRow key={config.id} tableConfigId={config.id} />
          ))}
        </ul>
      </CustomScrollArea>
    </section>
  );
};
