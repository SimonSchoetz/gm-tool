import { FCProps } from '@/types';
import './ScreensTextEditorLayout.css';
import { CustomScrollArea, GlassPanel } from '@/components';
import { ComponentProps, JSX } from 'react';
import { PREVIEW_WIDTH } from '../../screens.constants';

type Props = ComponentProps<typeof GlassPanel> & {
  sideBar: JSX.Element | null;
  header: JSX.Element | null;
  textEditor: JSX.Element;
};

export const ScreensTextEditorLayout: FCProps<Props> = ({
  header,
  sideBar,
  textEditor,
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

      <CustomScrollArea>
        <div className='screens-text-editor-layout--text-area'>
          {header}

          {textEditor}
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
