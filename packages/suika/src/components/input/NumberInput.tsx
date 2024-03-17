import { parseToNumber } from '@suika/common';
import { type FC, useEffect, useRef } from 'react';

import CustomRuleInput from './CustomRuleInput';

const isNumberStr = (str: string) => {
  return !Number.isNaN(Number(str));
};

interface INumberInputProps {
  value: string | number;
  min?: number;
  onBlur: (newValue: number) => void;
  prefix?: React.ReactNode;
  /** suffix string after input value, such like ° => 12.34° */
  suffixValue?: string;
}

const NumberInput: FC<INumberInputProps> = ({
  value,
  min = -Infinity,
  onBlur,
  prefix,
  suffixValue = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

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
        if (!Number.isNaN(num) && num !== value) {
          num = Math.max(min, num);
          return String(num);
        } else {
          return false;
        }
      }}
      value={isNumberStr(String(value)) ? value + suffixValue : value}
      onBlur={(newVal) => onBlur(Number(newVal))}
    />
  );
};

export default NumberInput;
