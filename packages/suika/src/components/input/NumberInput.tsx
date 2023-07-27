import { FC, useEffect, useRef } from 'react';
import { parseToNumber } from '../../utils/common';
import CustomRuleInput from './CustomRuleInput';

interface INumberInputProps {
  value: string | number;
  min?: number;
  onBlur: (newValue: number) => void;
  prefix?: React.ReactNode;
}

const NumberInput: FC<INumberInputProps> = ({ value, min, onBlur, prefix }) => {
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
        const number = parseToNumber(str);
        if (!Number.isNaN(number) && number !== value) {
          return String(number);
        } else {
          return false;
        }
      }}
      value={value}
      onBlur={(newVal) => onBlur(Math.max(min ?? -Infinity, Number(newVal)))}
    />
  );
};

export default NumberInput;
