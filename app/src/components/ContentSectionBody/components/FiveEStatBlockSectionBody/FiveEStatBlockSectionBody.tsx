import { useBaseEntityContentSections } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { patchFiveEStatBlockContent, readFiveEStatBlockContent } from '@domain';
import type { SectionBodyProps } from '../../types';
// Imported before the groups so their stylesheets load after it: its `label` rules and the groups' `label` rules tie on specificity, and the later one wins.
import './FiveEStatBlockSectionBody.css';
import { FiveEStatBlockAbilities } from './components/FiveEStatBlockAbilities/FiveEStatBlockAbilities';
import { FiveEStatBlockBaseStats } from './components/FiveEStatBlockBaseStats/FiveEStatBlockBaseStats';
import { FiveEStatBlockDefenses } from './components/FiveEStatBlockDefenses/FiveEStatBlockDefenses';
import { FiveEStatBlockMisc } from './components/FiveEStatBlockMisc/FiveEStatBlockMisc';
import type { FiveEStatBlockGroupProps } from './types';

type Props = SectionBodyProps;

// Renders the structured 5e fields of one section, read from its content once per render.
export const FiveEStatBlockSectionBody: FCProps<Props> = ({
  section,
  baseEntityId,
  readOnly,
}) => {
  // The one hook instance of this body: it owns one autosave queue, and a second instance would flush its own pending content patch out of edit order on unmount, so the fields take `saveField` instead of calling the hook.
  const { updateSectionContent } = useBaseEntityContentSections(baseEntityId);
  const { fiveEStatBlock } = readFiveEStatBlockContent(section.content);

  // Every field rewrites the whole `content`, so each write composes against the cached section, never against the rendered `section`: composing against the render would let a quick edit in another field overwrite this one.
  const saveField: FiveEStatBlockGroupProps['saveField'] = (key, value) => {
    updateSectionContent(section.id, (current) =>
      patchFiveEStatBlockContent(current, key, value),
    );
  };

  const groupProps: FiveEStatBlockGroupProps = {
    readOnly,
    values: fiveEStatBlock,
    saveField,
  };

  return (
    <div className='five-e-stat-block-section-body'>
      <FiveEStatBlockBaseStats {...groupProps} />

      <FiveEStatBlockAbilities {...groupProps} />

      <FiveEStatBlockDefenses {...groupProps} />

      <FiveEStatBlockMisc {...groupProps} />
    </div>
  );
};
