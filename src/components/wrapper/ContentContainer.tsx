import { PropsWithChildren } from 'react';
import { InputLabelUnderline } from '../animations';
import { FCProps } from '@/types/app';
import { ConditionWrapper } from '.';

type ContentContainerProps = PropsWithChildren<{
  title?: string;
}>;

const ContentContainer: FCProps<ContentContainerProps> = ({
  children,
  title,
}) => {
  return (
    <div className='px-2'>
      <div className='mb-2 ml-8'>
        <ConditionWrapper condition={!!title}>
          <h2 style={{ textShadow: '5px 3px 3px var(--gm-bg)' }}>{title}</h2>
        </ConditionWrapper>

        <InputLabelUnderline
          focused={true}
          text={title}
          withShadow={true}
          className='text-4xl'
        />
      </div>
      <div style={{ boxShadow: '15px 20px 15px 10px var(--gm-bg-50)' }}>
        {children}
      </div>
    </div>
  );
};

export default ContentContainer;
