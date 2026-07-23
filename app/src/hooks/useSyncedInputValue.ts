import { useState } from 'react';

type SyncedInputValue = {
  value: string;
  setValue: (value: string) => void;
  focusProps: {
    onFocus: () => void;
    onBlur: () => void;
  };
};

// Local display state for an input bound to an auto-saved, externally-mutable value. Typing updates `value` immediately so editing stays jank-free, while a change to `externalValue` from outside the input — e.g. a synced edit from a paired device — is adopted only when the input is not focused, so it never overwrites active typing. Spread the returned `focusProps` onto the input so edit-focus is tracked.
export const useSyncedInputValue = (
  externalValue: string,
): SyncedInputValue => {
  const [value, setValue] = useState(externalValue);
  const [lastExternal, setLastExternal] = useState(externalValue);
  const [isFocused, setIsFocused] = useState(false);

  // Adopt a changed external value during render — React's sanctioned "adjust state when a prop changes" pattern, which avoids the set-state-in-effect lint — but only when the field is not focused, so an incoming sync never clobbers active typing.
  if (externalValue !== lastExternal) {
    setLastExternal(externalValue);
    if (!isFocused) {
      setValue(externalValue);
    }
  }

  return {
    value,
    setValue,
    focusProps: {
      onFocus: () => {
        setIsFocused(true);
      },
      onBlur: () => {
        setIsFocused(false);
      },
    },
  };
};
