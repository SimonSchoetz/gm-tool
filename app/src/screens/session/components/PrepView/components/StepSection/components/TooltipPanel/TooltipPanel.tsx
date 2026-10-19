import { findLazyDmStep, type LazyDmStepKey } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import './TooltipPanel.css';

type Props = {
  stepKey: LazyDmStepKey;
};

export const TooltipPanel: FCProps<Props> = ({ stepKey }) => {
  const definition = findLazyDmStep(stepKey);
  if (!definition) return;
  return <div className='step-tooltip-panel'>{definition.tooltip}</div>;
};
