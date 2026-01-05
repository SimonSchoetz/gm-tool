import { FCProps, HtmlProps } from '@/types';

type Props = { direction: 'left' | 'right' | 'up' | 'down' } & HtmlProps<'svg'>;

export const Chevron: FCProps<Props> = ({ direction, ...props }) => {
  const getPath = () => {
    switch (direction) {
      case 'right':
        return 'M1.25 13.25L7.25 7.25L1.25 1.25';
      case 'up':
        return 'M7.25 1.25L1.25 7.25L7.25 13.25';
      case 'down':
        return 'M1.25 1.25L7.25 7.25L1.25 13.25';
      case 'left':
      default:
        return 'M7.25 13.25L1.25 7.25L7.25 1.25';
    }
  };
  return (
    <svg width='9' height='15' viewBox='0 0 9 15' fill='none' {...props}>
      <path
        d={getPath()}
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};
