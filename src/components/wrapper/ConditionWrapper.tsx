import { PropsWithChildren } from 'react';

const ConditionWrapper = ({
  children,
  condition,
}: PropsWithChildren<{ condition: boolean }>) => {
  return condition ? children : <></>;
};

export default ConditionWrapper;
