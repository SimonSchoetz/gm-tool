import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';

export const Section: FCProps<HtmlProps<'section'>> = ({
  children,
  ...props
}) => {
  return <section {...props}>{children}</section>;
};
