import { PropsWithChildren } from 'react';

const MaxWidthWrapper = ({ children }: PropsWithChildren) => {
  return <div className='max-w-md w-full'>{children}</div>;
};

export default MaxWidthWrapper;
