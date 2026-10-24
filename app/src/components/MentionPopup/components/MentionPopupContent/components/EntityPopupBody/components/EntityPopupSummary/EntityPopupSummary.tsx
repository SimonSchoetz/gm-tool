import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { TextEditor } from '../../../../../../../TextEditor';

type Props = {
  summary: string;
  summaryHeader?: ReactNode;
  textEditorId: string;
};

export const EntityPopupSummary: FCProps<Props> = ({
  summary,
  summaryHeader,
  textEditorId,
}) => (
  <div className='entity-popup-body--summary'>
    {summaryHeader}
    <TextEditor
      value={summary}
      textEditorId={textEditorId}
      placeholder='Nothing here yet...'
      readOnly
    />
  </div>
);
