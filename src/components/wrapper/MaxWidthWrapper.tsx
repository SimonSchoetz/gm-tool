import { PropsWithChildren } from 'react';

const MaxWidthWrapper = ({ children }: PropsWithChildren) => {
  return <div className='max-w-md w-full px-2'>{children}</div>;
};

export default MaxWidthWrapper;
