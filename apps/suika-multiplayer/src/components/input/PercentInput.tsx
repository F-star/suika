import { type FC } from 'react';

import NumberInput from './NumberInput';

interface Props {
  prefix?: React.ReactNode;
  value: string | number;
  min?: number;
  max?: number;
  classNames?: string[];
  onChange: (value: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const PercentInput: FC<Props> = (props) => {
  const value =
    typeof props.value === 'number'
      ? Number((props.value * 100).toFixed(2))
      : props.value;
  const onChange = (value: number) => props.onChange(value / 100);

  const min = props.min === undefined ? undefined : props.min * 100;
  const max = props.max === undefined ? undefined : props.max * 100;

  return (
    <NumberInput
      value={value}
      min={min}
      max={max}
      suffixValue="%"
      onChange={onChange}
      prefix={props.prefix}
      classNames={props.classNames}
      onIncrement={props.onIncrement}
      onDecrement={props.onDecrement}
    />
  );
};
