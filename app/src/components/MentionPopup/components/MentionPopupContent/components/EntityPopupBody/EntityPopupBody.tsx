import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import type { SlideDirection } from '@/types/slideDirection.type';
import { ImageById } from '../../../../../ImageById/ImageById';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { PanelBody } from '../../../../../PanelBody/PanelBody';
import { SlideTransition } from '../../../../../SlideTransition/SlideTransition';
import { EntityPopupSummary } from './components/EntityPopupSummary/EntityPopupSummary';
import './EntityPopupBody.css';

type Props = {
  summary: string | null;
  summaryHeader?: ReactNode;
  imageId: string | null;
  textEditorId: string;
  summarySlide?: {
    slide: {
      direction: SlideDirection;
      outgoing: {
        summary: string | null;
        summaryHeader: ReactNode;
        textEditorId: string;
      };
    } | null;
    onEnd: () => void;
  };
};

export const EntityPopupBody: FCProps<Props> = ({
  summary,
  summaryHeader,
  imageId,
  textEditorId,
  summarySlide,
}) => {
  const currentSummary = summary !== null && (
    <EntityPopupSummary
      summary={summary}
      summaryHeader={summaryHeader}
      textEditorId={textEditorId}
    />
  );

  return (
    <PanelBody className='entity-popup-body'>
      {imageId !== null && (
        <ImagePlaceholderFrame
          className='entity-popup-body--image'
          dimensions={{
            width: 'var(--summary-content-height)',
            height: 'var(--summary-content-height)',
          }}
        >
          <ImageById imageId={imageId} />
        </ImagePlaceholderFrame>
      )}
      {summarySlide ? (
        <SlideTransition
          className='entity-popup-body--summary-region'
          slide={
            summarySlide.slide === null
              ? null
              : {
                  direction: summarySlide.slide.direction,
                  outgoing: summarySlide.slide.outgoing.summary !== null && (
                    <EntityPopupSummary
                      summary={summarySlide.slide.outgoing.summary}
                      summaryHeader={summarySlide.slide.outgoing.summaryHeader}
                      textEditorId={summarySlide.slide.outgoing.textEditorId}
                    />
                  ),
                }
          }
          onEnd={summarySlide.onEnd}
        >
          {currentSummary}
        </SlideTransition>
      ) : (
        currentSummary
      )}
    </PanelBody>
  );
};
