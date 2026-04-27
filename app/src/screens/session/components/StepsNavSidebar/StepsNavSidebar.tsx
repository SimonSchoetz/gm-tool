import './StepsNavSidebar.css';
import {
  ToggleSessionViewBtn,
  SessionStepsNav,
  DeleteSessionBtn,
} from './components';

export const StepsNavSidebar = () => {
  return (
    <aside className='steps-sidebar'>
      <ToggleSessionViewBtn />

      <SessionStepsNav />

      <DeleteSessionBtn />
    </aside>
  );
};
