import { FCProps } from '@/types/app';
import { Button } from '@react-email/components';
import { glassFX } from './styles';

type Props = {
  label: string;
  url: string;
};

const EmailButton: FCProps<Props> = ({ label, url, ...props }) => {
  return (
    <Button
      {...props}
      style={{
        ...glassFX,
        borderRadius: '.75rem',
        padding: '.5rem 1rem',
      }}
      href={url}
    >
      {label}
    </Button>
  );
};

export default EmailButton;
