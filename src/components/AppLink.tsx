import { FCProps } from '@/types/app';
import Link from 'next/link';
import { DetailedHTMLProps, LinkHTMLAttributes } from 'react';
import Button from './Button';
import { ConditionWrapper } from './wrapper';

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
  className = '',
  href,
  ...props
}) => {
  const layoutMap: Record<AppLinkLayout, string> = {
    [AppLinkLayout.LINK]: 'text-gm-fg-50 hover:text-gm-fg hover:underline',
    [AppLinkLayout.BUTTON]: '',
  };

  return (
    <Link
      {...props}
      className={`inline-block ${layoutMap[layout]} ${className ?? ''}`}
      href={href ?? '#'}
    >
      <ConditionWrapper condition={layout === AppLinkLayout.BUTTON}>
        <Button label={title} className={className} />
      </ConditionWrapper>

      <ConditionWrapper condition={layout === AppLinkLayout.LINK}>
        {title}
      </ConditionWrapper>
    </Link>
  );
};

export default AppLink;
