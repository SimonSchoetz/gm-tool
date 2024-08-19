import AppLink, { AppLinkLayout } from '@/components/AppLink';

export default function MainPage() {
  return (
    <>
      <h2 className='text-center mb-8'>THE GAME MASTER&apos;S TOOLKIT</h2>
      <AppLink layout={AppLinkLayout.BUTTON} url={'/login'} title='Log in' />
    </>
  );
}
