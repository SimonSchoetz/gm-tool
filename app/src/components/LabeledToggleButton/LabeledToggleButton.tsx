import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/util';
import ActionContainer from '../ActionContainer/ActionContainer';
import GlassPanel from '../GlassPanel/GlassPanel';
import './LabeledToggleButton.css';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export const LabeledToggleButton = <T extends string>({
  options,
  value,
  onChange,
  className,
}: Props<T>) => {
  const activeIndex = options[0].value === value ? 0 : 1;
  const [displayIndex, setDisplayIndex] = useState(activeIndex);

  const sliderRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([null, null]);
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync display index when value is changed externally by the parent.
  useEffect(() => {
    setDisplayIndex(activeIndex);
  }, [activeIndex]);

  // Cancel any pending onChange on unmount.
  useEffect(() => {
    return () => {
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    };
  }, []);

  // Reads offsetLeft/offsetWidth to match slider position and width to the active
  // label — must run before paint to avoid the slider appearing at a stale position.
  useLayoutEffect(() => {
    const activeLabel = labelRefs.current[displayIndex];
    const slider = sliderRef.current;
    if (!activeLabel || !slider) return;
    slider.style.left = `${activeLabel.offsetLeft}px`;
    slider.style.width = `${activeLabel.offsetWidth}px`;
  }, [displayIndex]);

  const handleClick = () => {
    const nextIndex = 1 - displayIndex;
    setDisplayIndex(nextIndex);

    const duration = sliderRef.current
      ? parseFloat(getComputedStyle(sliderRef.current).transitionDuration) *
        1000
      : 0;

    if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    pendingTimeout.current = setTimeout(() => {
      onChange(options[nextIndex].value);
      pendingTimeout.current = null;
    }, duration);
  };

  return (
    <ActionContainer
      invisible
      onClick={handleClick}
      label={options[1 - displayIndex].label}
      className={cn('labeled-toggle-btn', className)}
    >
      <GlassPanel className='labeled-toggle-panel' radius='md'>
        <div ref={sliderRef} className='labeled-toggle-slider' />
        {options.map((option, index) => (
          <span
            key={option.value}
            ref={(el) => {
              labelRefs.current[index] = el;
            }}
            className={cn(
              'labeled-toggle-label',
              displayIndex === index && 'labeled-toggle-label--active',
            )}
          >
            {option.label}
          </span>
        ))}
      </GlassPanel>
    </ActionContainer>
  );
};
