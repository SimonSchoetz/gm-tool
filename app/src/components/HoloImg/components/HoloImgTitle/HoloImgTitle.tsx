import { HtmlProps } from '@/types';
import { FCProps } from '@/types';
import './HoloImgTitle.css';
import { cn } from '@/util';

type Props = HtmlProps<'div'> & { title: string };

export const HoloImgTitle: FCProps<Props> = ({ title, className }) => {
  return (
    <div className={cn('holo-img-title content-center', className)}>
      {title}
    </div>
  );
};
