import { useTableConfig } from '@/providers/table-config';
import { GlassPanel, CustomScrollArea } from '@/components';
import type { TableConfig } from '@db/table-config';
import './SettingsScreen.css';

export const SettingsScreen = () => {
  const { tableConfigs, loading, updateTableConfig } = useTableConfig();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <GlassPanel className='settings-screen'>
      <h2 className='settings-heading'>Table Configuration</h2>
      <CustomScrollArea>
        <ul className='settings-config-list'>
          {tableConfigs.map((config) => (
            <TableConfigRow
              key={config.id}
              config={config}
              onUpdate={updateTableConfig}
            />
          ))}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};

type TableConfigRowProps = {
  config: TableConfig;
  onUpdate: (id: string, data: Partial<TableConfig>) => Promise<void>;
};

const TableConfigRow = ({ config, onUpdate }: TableConfigRowProps) => {
  const isTaggingEnabled = config.tagging_enabled === 1;

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(config.id, { color: e.target.value });
  };

  const handleTaggingToggle = () => {
    onUpdate(config.id, {
      tagging_enabled: isTaggingEnabled ? 0 : 1,
    });
  };

  return (
    <li>
      <GlassPanel intensity='bright' className='settings-config-row'>
        <div className='settings-config-name'>
          <label className='settings-color-dot-wrapper'>
            <input
              type='color'
              value={config.color}
              onChange={handleColorChange}
              className='settings-color-input-hidden'
            />
            <span
              className='settings-color-dot'
              style={{ backgroundColor: config.color }}
            />
          </label>
          <span>{config.display_name}</span>

          <span className='settings-label'>Scope</span>
          <span className='settings-scope-value'>{config.scope}</span>
        </div>

        <div className='settings-config-controls'>
          <label className='settings-control-group'>
            <span className='settings-label'>Tagging:</span>
            <button
              onClick={handleTaggingToggle}
              className={`settings-toggle ${isTaggingEnabled ? 'settings-toggle-on' : 'settings-toggle-off'}`}
            >
              {isTaggingEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </label>
        </div>
      </GlassPanel>
    </li>
  );
};
