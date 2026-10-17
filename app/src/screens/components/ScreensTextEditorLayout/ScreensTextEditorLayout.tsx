import { FCProps } from '@/types/fcProps.type';
import './ScreensTextEditorLayout.css';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { JSX } from 'react';
import { PREVIEW_WIDTH } from '../../screens.constants';

type Props = {
  header: JSX.Element;
  sideBar: JSX.Element;
  bodyHeader?: JSX.Element | null;
  body: JSX.Element;
};

export const ScreensTextEditorLayout: FCProps<Props> = ({
  header,
  sideBar,
  bodyHeader,
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
      <header className='screens-text-editor-layout--header'>{header}</header>

      <div className='screens-text-editor-layout--main'>
        {sideBar}
        <div className='screens-text-editor-layout--body'>
          {bodyHeader}
          <div className='screens-text-editor-layout--body-scroll'>{body}</div>
        </div>
      </div>
    </GlassPanel>
  );
};
