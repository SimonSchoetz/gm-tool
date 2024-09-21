import AppLink, { AppLinkLayout } from '@/components/AppLink';
import { GlassPanel } from '@/components/wrapper';
import { Route } from '@/enums';
import { NextPage } from 'next';

const MainPage: NextPage = () => {
  return (
    <GlassPanel className='flex flex-col gap-8 items-center justify-center max-w-screen-sm w-full'>
      <h2 className='text-center mb-8'>THE GAME MASTER&apos;S TOOLKIT</h2>

      <p>Create an account to get started</p>

      <AppLink
        layout={AppLinkLayout.BUTTON}
        href={Route.SIGN_UP}
        title='Sign up'
        className='w-full max-w-sm'
      />

      <p>or log in</p>

      <AppLink
        layout={AppLinkLayout.BUTTON}
        href={Route.LOGIN}
        title='Log in'
        className='w-full max-w-sm'
      />
    </GlassPanel>
  );
};

export default MainPage;
