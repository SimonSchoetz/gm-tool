'use client';

import { DivProps } from '@/types/app';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import { ConditionWrapper } from '../wrapper';

type LabelConnectorProps = {
  focused: boolean;
  text?: string | JSX.Element;
  withShadow?: boolean;
} & DivProps;

const InputLabelUnderline = ({
  focused,
  text,
  withShadow = false,
  className = '',
}: LabelConnectorProps) => {
  const textWidthRef = useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  const canAnimate: boolean = focused && !!labelWidth;

  useEffect(() => {
    if (textWidthRef.current) {
      setLabelWidth(textWidthRef.current.offsetWidth);
    }
  }, [textWidthRef]);

  const transitionTime = '0.1s';
  const topOffset = '-4px';

  const commonStyles: CSSProperties = {
    top: topOffset,
    transition: `${transitionTime}`,
    transitionTimingFunction: 'linear',
    position: 'relative',
    backgroundColor: 'var(--gm-fg)',
  };

  const getTextWidth = () => {
    return (
      <span
        aria-hidden
        className={`absolute opacity-0 ${className}`}
        ref={textWidthRef}
      >
        {text}
      </span>
    );
  };

  const renderHorizontalLine = (styles?: CSSProperties) => {
    return (
      <span
        style={{
          ...commonStyles,
          height: '1.3px',
          width: canAnimate ? `${labelWidth}px` : '0',
          transitionDelay: canAnimate ? '0s' : `${transitionTime}`,
          ...styles,
        }}
      ></span>
    );
  };

  const renderConnector = (styles?: CSSProperties) => {
    return (
      <span
        style={{
          ...commonStyles,
          height: '1px',
          width: canAnimate ? `${16}px` : '0',
          left: canAnimate ? `${-3.3}px` : '0',
          transitionDelay: canAnimate ? `${transitionTime}` : '0s',
          transform: 'rotate(50deg)',
          top: canAnimate ? `${1.8}px` : '-3.5px',
          ...styles,
        }}
      ></span>
    );
  };

  const renderUnderLine = () => {
    return (
      <span className='absolute flex'>
        {renderHorizontalLine()}
        {renderConnector()}
      </span>
    );
  };

  const renderDropShadow = () => {
    const shadowStyles: CSSProperties = {
      backgroundColor: 'var(--gm-bg)',
      filter: 'blur(1.5px)',
    };
    return (
      <span className='absolute flex -z-[1] left-[5px] top-[3px]'>
        {renderHorizontalLine(shadowStyles)}
        {renderConnector(shadowStyles)}
      </span>
    );
  };
  return (
    <div className='relative'>
      {getTextWidth()}

      <span className='absolute flex'>
        {renderUnderLine()}
        <ConditionWrapper condition={withShadow}>
          {renderDropShadow()}
        </ConditionWrapper>
      </span>
    </div>
  );
};

export default InputLabelUnderline;
