import { FCProps } from '@/types';
import './ScreensTextEditorLayout.css';
import { CustomScrollArea, GlassPanel } from '@/components';
import { ComponentProps, JSX } from 'react';

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
    <GlassPanel className='text-editor-layout'>
      {sideBar}

      <CustomScrollArea>
        <div className='text-editor-layout--text-area'>
          {header}

          {textEditor}
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
