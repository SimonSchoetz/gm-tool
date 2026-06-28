import { GlassPanel } from '@/components';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import './AppearanceSection.css';
import { EnableButton } from '../EnableButton/EnableButton';
export const AppearanceSection = () => {
  return (
    <Section>
      <H2 heading='Appearance' />

      <GlassPanel intensity='bright' className='appearance-item'>
        <label className='appearance-item--content'>
          <span>Background Animation</span>
          <EnableButton
            isEnabled={true}
            onClick={() => {
              console.log('tbd: toggle bg animation settings');
            }}
          />
        </label>
      </GlassPanel>
    </Section>
  );
};
