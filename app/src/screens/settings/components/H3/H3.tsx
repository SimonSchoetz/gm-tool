import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';

import './H3.css';

type H3Props = { heading: string } & HtmlProps<'h3'>;

export const H3: FCProps<H3Props> = ({ heading, ...props }) => {
  return (
    <h3 className='settings-screen--h3' {...props}>
      {heading}
    </h3>
  );
};
