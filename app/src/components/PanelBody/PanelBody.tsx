import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import { cn } from '@/util/className';
import './PanelBody.css';

export const PanelBody: FCProps<HtmlProps<'div'>> = ({
  className,
  ...props
}) => <div className={cn('panel-body', className)} {...props} />;
