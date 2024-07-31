'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

type LabelConnectorProps = {
  focused: boolean;
  text?: string;
};

const InputLabelUnderline = ({ focused, text }: LabelConnectorProps) => {
  const labelRef = useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth);
    }
  }, [labelRef]);

  const transitionTime = '0.1s';
  const topOffset = '-0.25rem';

  const commonStyles: CSSProperties = {
    top: topOffset,
    transition: `${transitionTime}`,
    transitionTimingFunction: 'linear',
  };

  const getTextWidth = () => {
    return (
      <span aria-hidden className='absolute opacity-0' ref={labelRef}>
        {text}
      </span>
    );
  };

  return (
    <div className='relative'>
      {getTextWidth()}

      <div className='absolute ml-4 flex'>
        <div
          className={`bg-gm-primary-very-high-contrast relative`}
          style={{
            ...commonStyles,
            height: '1px',
            width: focused ? `${labelWidth}px` : '0',
            transitionDelay: focused ? '0s' : `${transitionTime}`,
          }}
        ></div>
        <div
          className={`bg-gm-primary-very-high-contrast relative `}
          style={{
            ...commonStyles,
            height: '1px',
            width: focused ? `${16}px` : '0',
            left: focused ? `${-3}px` : '0',
            transitionDelay: focused ? `${transitionTime}` : '0s',
            transform: 'rotate(50deg)',
            top: focused ? `${1.6}px` : '-3.5px',
          }}
        ></div>
      </div>
    </div>
  );
};

export default InputLabelUnderline;
