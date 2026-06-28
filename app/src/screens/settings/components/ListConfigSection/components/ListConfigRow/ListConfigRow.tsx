import type { FCProps } from '@/types';
import { useTableConfig } from '@/data-access-layer';
import { ColorInput, GlassPanel } from '@/components';
import './ListConfigRow.css';
import { EnableButton } from '../../../EnableButton/EnableButton';

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

  const capitalizedTableName =
    config.table_name.charAt(0).toUpperCase() + config.table_name.slice(1);

  return (
    <li>
      <GlassPanel intensity='bright' className='list-config-row'>
        <label className='list-config-name'>
          <ColorInput
            label={capitalizedTableName}
            value={config.color}
            onChange={(value) => {
              void updateTableConfig({ color: value });
            }}
          />
        </label>

        <div>
          <label className='list-config--scope'>
            Scope:
            <span className='list-config--scope-value'>{config.scope}</span>
          </label>
        </div>

        <label className='list-config--tagging'>
          Tagging:
          <EnableButton
            isEnabled={isTaggingEnabled}
            onClick={handleTaggingToggle}
          />
        </label>
      </GlassPanel>
    </li>
  );
};
