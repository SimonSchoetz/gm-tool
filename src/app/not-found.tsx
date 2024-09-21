import AppLink, { AppLinkLayout } from '@/components/AppLink';
import { GlassPanel } from '@/components/wrapper';
import { Route } from '@/enums';
import { NextPage } from 'next';

const NotFound: NextPage = () => {
  return (
    <GlassPanel className='flex flex-col gap-8 items-center justify-center max-w-screen-sm w-full'>
      <h1>404</h1>

      <p>This page does not exist</p>

      <AppLink
        href={Route.HOME}
        title='Go to home'
        layout={AppLinkLayout.BUTTON}
        className='w-full max-w-sm'
      />
    </GlassPanel>
  );
};

export default NotFound;
