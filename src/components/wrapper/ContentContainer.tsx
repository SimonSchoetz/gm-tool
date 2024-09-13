import { PropsWithChildren } from 'react';
import { InputLabelUnderline } from '../animations';

type ContentContainerProps = PropsWithChildren<{
  title: string;
}>;

const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  title,
}) => {
  return (
    <>
      <div className='mb-2 ml-8'>
        <h2 style={{ textShadow: '5px 3px 2px var(--gm-bg)' }}>{title}</h2>

        <InputLabelUnderline focused={true} text={title} className='text-4xl' />
      </div>
      <div style={{ boxShadow: '15px 20px 15px 10px var(--gm-bg-50)' }}>
        {children}
      </div>
    </>
  );
};

export default ContentContainer;
