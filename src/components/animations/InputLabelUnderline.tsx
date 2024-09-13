'use client';

import { DivProps } from '@/app/_types';
import { CSSProperties, useEffect, useRef, useState } from 'react';

type LabelConnectorProps = {
  focused: boolean;
  text?: string;
} & DivProps;

const InputLabelUnderline = ({
  focused,
  text,
  ...props
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
  const topOffset = '-0.25rem';

  const commonStyles: CSSProperties = {
    top: topOffset,
    transition: `${transitionTime}`,
    transitionTimingFunction: 'linear',
  };

  const getTextWidth = () => {
    return (
      <span
        aria-hidden
        className={`absolute opacity-0 ${props.className}`}
        ref={textWidthRef}
      >
        {text}
      </span>
    );
  };

  return (
    <div className='relative'>
      {getTextWidth()}

      <span className='absolute flex'>
        <span
          className={`bg-gm-fg relative`}
          style={{
            ...commonStyles,
            height: '1.3px',
            width: canAnimate ? `${labelWidth}px` : '0',
            transitionDelay: canAnimate ? '0s' : `${transitionTime}`,
          }}
        ></span>

        <span
          className={`bg-gm-fg relative `}
          style={{
            ...commonStyles,
            height: '1px',
            width: canAnimate ? `${16}px` : '0',
            left: canAnimate ? `${-3.3}px` : '0',
            transitionDelay: canAnimate ? `${transitionTime}` : '0s',
            transform: 'rotate(50deg)',
            top: canAnimate ? `${1.8}px` : '-3.5px',
          }}
        ></span>
      </span>
    </div>
  );
};

export default InputLabelUnderline;
