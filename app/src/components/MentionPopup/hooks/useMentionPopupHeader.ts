import { useContext } from 'react';
import { MentionPopupHeaderContext } from '../MentionPopupHeaderContext';

export const useMentionPopupHeader = () => {
  const value = useContext(MentionPopupHeaderContext);
  if (value === null) {
    throw new Error(
      'useMentionPopupHeader must be called within a MentionPopup',
    );
  }
  return value;
};
