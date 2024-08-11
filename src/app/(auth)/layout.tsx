import { MaxWidthWrapper } from '@/components/wrapper';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MaxWidthWrapper>{children}</MaxWidthWrapper>;
}
