import { FCProps, HtmlProps } from '@/types';
import './Shimmer.css';

export const Shimmer: FCProps<HtmlProps<'div'>> = ({ ...props }) => {
  return <div className='holo-fx-shimmer' {...props} />;
};
