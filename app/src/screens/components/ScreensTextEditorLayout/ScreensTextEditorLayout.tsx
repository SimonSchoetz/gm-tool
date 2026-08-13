import { FCProps } from '@/types';
import './ScreensTextEditorLayout.css';
import { GlassPanel } from '@/components';
import { ComponentProps, JSX } from 'react';
import { PREVIEW_WIDTH } from '../../screens.constants';

type Props = ComponentProps<typeof GlassPanel> & {
  sideBar: JSX.Element | null;
  header: JSX.Element | null;
  body: JSX.Element;
};

export const ScreensTextEditorLayout: FCProps<Props> = ({
  header,
  sideBar,
  body,
}) => {
  return (
    <GlassPanel
      style={
        {
          '--sidebar-inner-width': `${PREVIEW_WIDTH}px`,
        } as React.CSSProperties
      }
      className='screens-text-editor-layout'
    >
      {sideBar}

      <div className='screens-text-editor-layout--edit-area'>
        {header}
        <div className='screens-text-editor-layout--body'>{body}</div>
      </div>
    </GlassPanel>
  );
};
