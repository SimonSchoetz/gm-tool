import { FCProps, HtmlProps } from '@/types';
import './SideBarNav.css';
import GlassPanel from '../GlassPanel/GlassPanel';
import ActionContainer from '../ActionContainer/ActionContainer';

type Props = HtmlProps<'aside'>;

export const SideBarNav: FCProps<Props> = ({ ...props }) => {
  return (
    <aside {...props}>
      <GlassPanel>
        <div className='fw-bw-btn-container'>
          <ActionContainer onClick={() => 'Go Back'}>
            <GlassPanel className='fw-bw-btn content-center'>
              <span> &larr; </span>
            </GlassPanel>
          </ActionContainer>

          <ActionContainer onClick={() => 'Go Forward'}>
            <GlassPanel className='fw-bw-btn content-center'>
              <span> &rarr; </span>
            </GlassPanel>
          </ActionContainer>
        </div>
      </GlassPanel>
    </aside>
  );
};
