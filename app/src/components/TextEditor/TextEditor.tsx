import { FCProps } from '@/types';
import { cn } from '@/util';

type Props = object;

export const TextEditor: FCProps<Props> = ({ ...props }) => {
  return (
    <div className={cn('text-editor')} {...props}>
      TextEditor
    </div>
  );
};
