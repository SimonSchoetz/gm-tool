import { FCProps } from '@/types/app';
import Link from 'next/link';
import { DetailedHTMLProps, LinkHTMLAttributes } from 'react';

export enum AppLinkLayout {
  BUTTON = 'button',
  LINK = 'link',
}

type Props = DetailedHTMLProps<
  LinkHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  title: string;
  layout?: AppLinkLayout;
};

const AppLink: FCProps<Props> = ({
  title,
  layout = AppLinkLayout.LINK,
  className,
  href,
  ...props
}) => {
  const layoutMap: Record<AppLinkLayout, string> = {
    [AppLinkLayout.LINK]: 'text-gm-fg-50 hover:text-gm-fg hover:underline',
    [AppLinkLayout.BUTTON]:
      'bg-gm-fg text-gm-bg rounded-xl px-4 py-2 hover:bg-gm-primary',
  };

  return (
    <Link
      {...props}
      className={`inline-block ${layoutMap[layout]} ${className ?? ''}`}
      href={href ?? '#'}
    >
      {title}
    </Link>
  );
};

export default AppLink;
