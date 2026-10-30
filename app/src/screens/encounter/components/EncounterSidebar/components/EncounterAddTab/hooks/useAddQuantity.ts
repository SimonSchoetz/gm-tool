import { useState } from 'react';
import { parseAddQuantity } from '@domain';

export const useAddQuantity = (): {
  quantity: number | null;
  quantityText: string;
  changeQuantityText: (text: string) => void;
  revertQuantityText: () => void;
  reset: () => void;
} => {
  const [quantityText, setQuantityText] = useState('1');
  const [lastValidQuantity, setLastValidQuantity] = useState(1);

  return {
    quantity: parseAddQuantity(quantityText),
    quantityText,
    changeQuantityText: (text) => {
      setQuantityText(text);
      const validQuantity = parseAddQuantity(text);
      if (validQuantity !== null) setLastValidQuantity(validQuantity);
    },
    revertQuantityText: () => {
      setQuantityText(String(lastValidQuantity));
    },
    reset: () => {
      setQuantityText('1');
      setLastValidQuantity(1);
    },
  };
};
