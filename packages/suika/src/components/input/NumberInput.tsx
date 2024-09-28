import { parseToNumber } from '@suika/common';
import { type FC, useEffect, useRef } from 'react';

import CustomRuleInput from './CustomRuleInput';

const isNumberStr = (str: string) => {
  return !Number.isNaN(Number(str));
};

const getScalarBySuffix = (str?: string) => {
  switch (str) {
    case '%':
      return 100;
    case '‰':
      return 1000;
    default:
      return 1;
  }
};

interface INumberInputProps {
  value: string | number;
  min?: number;
  max?: number;
  onBlur: (newValue: number) => void;
  prefix?: React.ReactNode;
  /** suffix string after input value, such like ° => 12.34° */
  suffixValue?: string;
}

const NumberInput: FC<INumberInputProps> = ({
  value,
  min = -Infinity,
  max = Infinity,
  onBlur,
  prefix,
  suffixValue = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const scalar = getScalarBySuffix(suffixValue);
  const tempValue =
    scalar !== 1
      ? Math.round(parseToNumber(String(value)) * scalar * 100) / 100
      : value;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <CustomRuleInput
      prefix={prefix}
      parser={(str) => {
        str = str.trim();
        if (suffixValue && str.endsWith(suffixValue)) {
          str = str.slice(0, -suffixValue.length);
        }

        let num = parseToNumber(str);
        if (!Number.isNaN(num) && num !== tempValue) {
          num = Math.max(min * scalar, num);
          num = Math.min(max * scalar, num);
          return String(num);
        } else {
          return false;
        }
      }}
      value={
        isNumberStr(String(tempValue)) ? tempValue + suffixValue : tempValue
      }
      onBlur={(newVal) => onBlur(Number(newVal) / scalar)}
    />
  );
};

export default NumberInput;
