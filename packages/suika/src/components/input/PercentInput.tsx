import { type FC } from 'react';

import NumberInput from './NumberInput';

interface Props {
  value: string | number;
  onBlur: (value: number) => void;
}

export const PercentInput: FC<Props> = (props) => {
  const value =
    typeof props.value === 'number'
      ? Number((props.value * 100).toFixed(2))
      : props.value;
  const onBlur = (value: number) => props.onBlur(value / 100);

  return (
    <NumberInput
      value={value}
      min={0}
      max={100}
      suffixValue="%"
      onBlur={onBlur}
    />
  );
};
