import { MaxWidthWrapper } from '@/components/wrapper';

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MaxWidthWrapper>{children}</MaxWidthWrapper>;
}
