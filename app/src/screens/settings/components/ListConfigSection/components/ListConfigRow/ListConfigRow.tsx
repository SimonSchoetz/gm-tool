import type { FCProps } from '@/types';
import { useTableConfig } from '@/data-access-layer';
import { ColorInput, GlassPanel } from '@/components';
import './ListConfigRow.css';

type ListConfigRowProps = { listConfigId: string };

export const ListConfigRow: FCProps<ListConfigRowProps> = ({
  listConfigId,
}) => {
  const { config, updateTableConfig } = useTableConfig(listConfigId);
  if (!config) return null;

  const isTaggingEnabled = config.tagging_enabled === 1;

  const handleTaggingToggle = () => {
    void updateTableConfig({ tagging_enabled: isTaggingEnabled ? 0 : 1 });
  };

  return (
    <li>
      <GlassPanel intensity='bright' className='list-config-row'>
        <div className='list-config-name'>
          <ColorInput
            value={config.color}
            onChange={(value) => {
              void updateTableConfig({ color: value });
            }}
          />
          <span>{config.table_name}</span>

          <span className='list-label'>Scope</span>
          <span className='list-scope-value'>{config.scope}</span>
        </div>

        <div className='list-config-controls'>
          <label className='list-control-group'>
            <span className='list-label'>Tagging:</span>
            <button
              type='button'
              onClick={handleTaggingToggle}
              className={`list-toggle ${isTaggingEnabled ? 'list-toggle-on' : 'list-toggle-off'}`}
            >
              {isTaggingEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </label>
        </div>
      </GlassPanel>
    </li>
  );
};
