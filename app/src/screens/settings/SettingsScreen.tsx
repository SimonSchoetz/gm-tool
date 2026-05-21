import { useTableConfigs } from '@/data-access-layer';
import { GlassPanel, CustomScrollArea } from '@/components';
import { TableConfigRow } from './components';
import './SettingsScreen.css';

export const SettingsScreen = () => {
  const { tableConfigs, loading } = useTableConfigs();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <GlassPanel className='settings-screen'>
      <h2 className='settings-heading'>Table Configuration</h2>
      <CustomScrollArea>
        <ul className='settings-config-list'>
          {tableConfigs.map((config) => (
            <TableConfigRow key={config.id} tableConfigId={config.id} />
          ))}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};
