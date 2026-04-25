import { LAZY_DM_STEPS } from '@/domain';
import type { LazyDmStepKey } from '@db/session-step';
import { FCProps } from '@/types';
import './TooltipPanel.css';

type Props = {
  stepKey: LazyDmStepKey;
};

export const TooltipPanel: FCProps<Props> = ({ stepKey }) => {
  const definition = LAZY_DM_STEPS.find((s) => s.key === stepKey);
  if (!definition) return null;
  return <div className='step-tooltip-panel'>{definition.tooltip}</div>;
};
