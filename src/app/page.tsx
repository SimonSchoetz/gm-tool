import AppLink, { AppLinkLayout } from '@/components/AppLink';

export default function MainPage() {
  return (
    <>
      <h2 className='text-center'>Welcome!</h2>
      <AppLink
        layout={AppLinkLayout.BUTTON}
        url={'/new-adventure'}
        title='Create your fist adventure!'
      />
    </>
  );
}
