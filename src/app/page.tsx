import { submitLogout } from '@/actions/auth';
import AppLink, { AppLinkLayout } from '@/components/AppLink';
import Button from '@/components/Button';
import { ConditionWrapper, GlassPanel } from '@/components/wrapper';
import { Route } from '@/enums';
import { getSession } from '@/util/app';
import { NextPage } from 'next';

const MainPage: NextPage = async () => {
  const session = await getSession();

  return (
    <>
      <header></header>
      <GlassPanel className='flex flex-col gap-8 items-center justify-center max-w-screen-sm w-full'>
        <h2 className='text-center mb-8'>THE GAME MASTER&apos;S TOOLKIT</h2>

        <ConditionWrapper condition={!!session}>
          <p>Hey {session?.userName || session?.email}!</p>
          <form action={submitLogout}>
            <Button label='Log out' type='submit' />
          </form>
        </ConditionWrapper>

        <ConditionWrapper condition={!session}>
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
        </ConditionWrapper>
      </GlassPanel>
    </>
  );
};

export default MainPage;
