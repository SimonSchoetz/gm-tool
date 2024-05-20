import Link from 'next/link';

export enum AppLinkLayout {
  TEXT = 'text',
  BUTTON = 'button',
}

type Props = {
  url: string;
  title: string;
  layout?: AppLinkLayout;
  external?: boolean;
};

const AppLink = ({
  url,
  title,
  layout = AppLinkLayout.TEXT,
  external,
}: Props) => {
  const layoutMap: Record<AppLinkLayout, string> = {
    [AppLinkLayout.TEXT]: 'text-slate-600 underline hover:text-slate-400',
    [AppLinkLayout.BUTTON]:
      'bg-slate-600 text-white rounded-xl px-4 py-2 hover:bg-slate-400',
  };

  return (
    <Link
      className={layoutMap[layout]}
      href={url}
      target={external ? '_blank' : ''}
    >
      {title}
    </Link>
  );
};

export default AppLink;
