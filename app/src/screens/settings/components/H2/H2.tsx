import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './H2.css';

type Props = { heading: string } & HtmlProps<'h2'>;

export const H2: FCProps<Props> = ({ heading }) => {
  return <h2 className='settings-screen--h2'>{heading}</h2>;
};
