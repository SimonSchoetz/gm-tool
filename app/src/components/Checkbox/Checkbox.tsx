import { FCProps, HtmlProps } from '@/types';
import './Checkbox.css';
import { cn } from '@/util';
import { GlassPanel } from '@/components';
import { CheckIcon } from 'lucide-react';

/**
 * use width to define its dimensions
 */
export const Checkbox: FCProps<HtmlProps<'input'>> = ({
  className,
  checked,
  ...props
}) => {
  return (
    <GlassPanel className={cn('checkbox-container', className)}>
      <input
        type='checkbox'
        className={cn('checkbox')}
        checked={checked}
        {...props}
      />

      <div
        className={cn(
          'checkbox-indicator',
          checked && 'checkbox-indicator__checked',
        )}
      >
        {checked && <CheckIcon className='checkbox-icon' />}

        <div
          className={cn(
            'checkbox-indicator-bg',
            checked && 'checkbox-indicator-bg__checked',
          )}
        ></div>
      </div>
    </GlassPanel>
  );
};
