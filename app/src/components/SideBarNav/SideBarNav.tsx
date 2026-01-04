import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  return (
    <aside {...props}>
      <GlassPanel>
        <h1>Side Bar Nav</h1>
      </GlassPanel>
    </aside>
  );
};
