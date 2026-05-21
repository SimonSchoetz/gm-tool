import type { FCProps } from '@/types';
import { useTableConfig } from '@/data-access-layer';
import { ColorInput, GlassPanel } from '@/components';

type TableConfigRowProps = { tableConfigId: string };

export const TableConfigRow: FCProps<TableConfigRowProps> = ({ tableConfigId }) => {
  const { config, updateTableConfig } = useTableConfig(tableConfigId);
  if (!config) return null;

  const isTaggingEnabled = config.tagging_enabled === 1;

  const handleTaggingToggle = () => {
    void updateTableConfig({ tagging_enabled: isTaggingEnabled ? 0 : 1 });
  };

  return (
    <li>
      <GlassPanel intensity='bright' className='settings-config-row'>
        <div className='settings-config-name'>
          <ColorInput
            value={config.color}
            onChange={(value) => { void updateTableConfig({ color: value }); }}
          />
          <span>{config.table_name}</span>

          <span className='settings-label'>Scope</span>
          <span className='settings-scope-value'>{config.scope}</span>
        </div>

        <div className='settings-config-controls'>
          <label className='settings-control-group'>
            <span className='settings-label'>Tagging:</span>
            <button
              type='button'
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
