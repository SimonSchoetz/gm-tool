'use client';

import AppLink from '@/components/AppLink';
import { ConditionWrapper, MaxWidthWrapper } from '@/components/wrapper';
import { Route } from '@/enums';
import { usePathname } from 'next/navigation';

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathName = usePathname();

  const isLogin = pathName.includes(Route.LOGIN);

  const isSignUp = pathName.includes(Route.SIGN_UP);

  return (
    <>
      <header className='w-full p-4 flex justify-between backdrop-blur-[2px] bg-gm-primary-20 sticky top-0 mb-8'>
        <AppLink href='/' title='Home' />

        <ConditionWrapper condition={isSignUp}>
          <AppLink href={Route.LOGIN} title='Login' />
        </ConditionWrapper>
        <ConditionWrapper condition={isLogin}>
          <AppLink href={Route.SIGN_UP} title='Sign Up' />
        </ConditionWrapper>
      </header>
      <MaxWidthWrapper>{children}</MaxWidthWrapper>
    </>
  );
}
