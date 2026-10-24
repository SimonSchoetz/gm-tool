import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../types';
import './FiveEStatBlockSectionBody.css';
import {
  FiveEStatBlockAbilities,
  FiveEStatBlockBaseStats,
  FiveEStatBlockDefenses,
  FiveEStatBlockMisc,
} from './components';

type Props = SectionBodyProps;

// Renders as a plain text editor today; kept apart from TextSectionBody because the 5e structure lands here later.
export const FiveEStatBlockSectionBody: FCProps<Props> = ({
  section,
  baseEntityId,
  readOnly,
}) => {
  return (
    <div className='five-e-stat-block-section-body'>
      <FiveEStatBlockBaseStats
        section={section}
        baseEntityId={baseEntityId}
        readOnly={readOnly}
      />

      <FiveEStatBlockAbilities
        section={section}
        baseEntityId={baseEntityId}
        readOnly={readOnly}
      />

      <FiveEStatBlockDefenses
        section={section}
        baseEntityId={baseEntityId}
        readOnly={readOnly}
      />

      <FiveEStatBlockMisc
        section={section}
        baseEntityId={baseEntityId}
        readOnly={readOnly}
      />
    </div>
  );
};
