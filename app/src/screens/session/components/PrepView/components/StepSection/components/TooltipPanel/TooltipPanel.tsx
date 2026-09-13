import { LAZY_DM_STEPS, type LazyDmStepKey } from '@domain';
import { FCProps } from '@/types';
import './TooltipPanel.css';

type Props = {
  stepKey: LazyDmStepKey;
};

export const TooltipPanel: FCProps<Props> = ({ stepKey }) => {
  const definition = LAZY_DM_STEPS.find((s) => s.key === stepKey);
  if (!definition) return;
  return <div className='step-tooltip-panel'>{definition.tooltip}</div>;
};
