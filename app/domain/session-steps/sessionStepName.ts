import type { LazyDmStepKey } from './lazyDmStepKeys';
import { findLazyDmStep } from './lazyDmSteps';

export const sessionStepName = (
  name: string | null,
  defaultStepKey: LazyDmStepKey | null,
): string => name ?? findLazyDmStep(defaultStepKey)?.name ?? 'Untitled Step';
