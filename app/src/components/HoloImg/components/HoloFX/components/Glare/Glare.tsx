import { FCProps, HtmlProps } from '@/types';
import './Glare.css';

export const Glare: FCProps<HtmlProps<'div'>> = ({ ...props }) => {
  return <div className='holo-fx-glare' {...props} />;
};
