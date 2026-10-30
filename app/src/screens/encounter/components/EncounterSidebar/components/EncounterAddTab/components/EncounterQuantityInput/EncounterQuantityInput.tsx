import { MAX_ADD_QUANTITY, MIN_ADD_QUANTITY } from '@domain';
import { Input } from '@/components/Input/Input';
import { FCProps } from '@/types/fcProps.type';
import './EncounterQuantityInput.css';

type Props = {
  quantityText: string;
  onQuantityTextChange: (text: string) => void;
} & Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'min' | 'max' | 'aria-label' | 'className' | 'value' | 'onChange'
>;

export const EncounterQuantityInput: FCProps<Props> = ({
  quantityText,
  onQuantityTextChange,
  ...props
}) => (
  <Input
    {...props}
    type='number'
    min={MIN_ADD_QUANTITY}
    max={MAX_ADD_QUANTITY}
    aria-label='Quantity'
    className='encounter-quantity-input number-input'
    value={quantityText}
    onChange={(event) => {
      onQuantityTextChange(event.currentTarget.value);
    }}
  />
);
