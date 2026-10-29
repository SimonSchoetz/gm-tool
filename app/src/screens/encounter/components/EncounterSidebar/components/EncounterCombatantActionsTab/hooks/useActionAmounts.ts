import { useState } from 'react';
import {
  settleActionAmounts,
  type ActionAmountsState,
} from '../helper/settleActionAmounts';

// Stryker disable next-line StringLiteral: a number input reads any non-numeric text as empty, so a changed initial text shows the same field and parses to no amount
const INITIAL_AMOUNTS: ActionAmountsState = { sharedText: '', rowTexts: {} };

export const useActionAmounts = (
  selectedIds: string[],
): {
  sharedText: string;
  amountTextOf: (id: string) => string;
  setSharedText: (text: string) => void;
  setRowText: (id: string, text: string) => void;
} => {
  const [amounts, setAmounts] = useState(INITIAL_AMOUNTS);

  const settled = settleActionAmounts(amounts, selectedIds);
  if (settled !== amounts) {
    setAmounts(settled);
  }

  return {
    sharedText: amounts.sharedText,
    amountTextOf: (id) => amounts.rowTexts[id] ?? amounts.sharedText,
    setSharedText: (text) => {
      setAmounts({ sharedText: text, rowTexts: {} });
    },
    setRowText: (id, text) => {
      setAmounts((current) => ({
        ...current,
        rowTexts: { ...current.rowTexts, [id]: text },
      }));
    },
  };
};
