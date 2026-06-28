import { FCProps, HtmlProps } from '@/types';

export const Section: FCProps<HtmlProps<'section'>> = ({
  children,
  ...props
}) => {
  return <section {...props}>{children}</section>;
};
