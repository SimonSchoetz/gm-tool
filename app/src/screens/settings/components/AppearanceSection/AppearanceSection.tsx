import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { useSetting } from '@/data-access-layer';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import './AppearanceSection.css';
import { EnableButton } from '../EnableButton/EnableButton';
export const AppearanceSection = () => {
  const { value, update } = useSetting('background');
  const isAnimationEnabled = value?.animation_enabled ?? true;

  const onToggle = () => {
    update({ animation_enabled: !isAnimationEnabled });
  };

  return (
    <Section>
      <H2 heading='Appearance' />

      <GlassPanel intensity='bright' className='appearance-item'>
        <label className='appearance-item--content'>
          <span>Background Animation</span>
          <EnableButton isEnabled={isAnimationEnabled} onClick={onToggle} />
        </label>
      </GlassPanel>
    </Section>
  );
};
