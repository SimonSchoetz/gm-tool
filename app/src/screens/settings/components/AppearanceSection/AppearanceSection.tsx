import { GlassPanel } from '@/components';
import { useSetting } from '@/data-access-layer';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import './AppearanceSection.css';
import { EnableButton } from '../EnableButton/EnableButton';
export const AppearanceSection = () => {
  const { value, update } = useSetting('background');

  return (
    <Section>
      <H2 heading='Appearance' />

      <GlassPanel intensity='bright' className='appearance-item'>
        <label className='appearance-item--content'>
          <span>Background Animation</span>
          <EnableButton
            isEnabled={value?.animation_enabled ?? true}
            onClick={() => {
              update({ animation_enabled: !(value?.animation_enabled ?? true) });
            }}
          />
        </label>
      </GlassPanel>
    </Section>
  );
};
