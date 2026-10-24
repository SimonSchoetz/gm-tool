import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import { BasicStatBlockSectionBody } from './components/BasicStatBlockSectionBody';
import { FiveEStatBlockSectionBody } from './components/FiveEStatBlockSectionBody/FiveEStatBlockSectionBody';
import { TextSectionBody } from './components/TextSectionBody/TextSectionBody';
import type { SectionBodyProps } from './types';
import './ContentSectionBody.css';

type Props = SectionBodyProps & HtmlProps<'div'>;

export const ContentSectionBody: FCProps<Props> = ({
  section,
  baseEntityId,
  readOnly,
  className,
  ...divProps
}) => {
  const renderBody = () => {
    switch (section.type) {
      case 'text':
        return (
          <TextSectionBody
            section={section}
            baseEntityId={baseEntityId}
            readOnly={readOnly}
          />
        );
      case 'basic-stat-block':
        // Keyed by section id, so switching between two stat-block sections remounts the body and resets its HP field.
        return (
          <BasicStatBlockSectionBody
            key={section.id}
            section={section}
            baseEntityId={baseEntityId}
            readOnly={readOnly}
          />
        );
      case '5e-stat-block':
        return (
          <FiveEStatBlockSectionBody
            section={section}
            baseEntityId={baseEntityId}
            readOnly={readOnly}
          />
        );
    }
  };

  return (
    <div {...divProps} className={cn('content-section-body', className)}>
      {renderBody()}
    </div>
  );
};
