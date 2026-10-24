import type {
  FiveEStatBlockContent,
  FiveEStatBlockNumberKey,
  FiveEStatBlockTextKey,
} from '@domain';

export type FiveEStatBlockGroupProps = {
  readOnly: boolean;
  values: FiveEStatBlockContent['fiveEStatBlock'];
  saveField: <K extends FiveEStatBlockNumberKey | FiveEStatBlockTextKey>(
    key: K,
    value: FiveEStatBlockContent['fiveEStatBlock'][K],
  ) => void;
};
