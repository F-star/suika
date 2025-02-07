import { type FC } from 'react';

import NumberInput from './NumberInput';

interface Props {
  prefix?: React.ReactNode;
  value: string | number;
  min?: number;
  max?: number;
  onBlur: (value: number) => void;
}

export const PercentInput: FC<Props> = (props) => {
  const value =
    typeof props.value === 'number'
      ? Number((props.value * 100).toFixed(2))
      : props.value;
  const onBlur = (value: number) => props.onBlur(value / 100);

  const min = props.min === undefined ? undefined : props.min * 100;
  const max = props.max === undefined ? undefined : props.max * 100;

  return (
    <NumberInput
      value={value}
      min={min}
      max={max}
      suffixValue="%"
      onBlur={onBlur}
      prefix={props.prefix}
    />
  );
};
