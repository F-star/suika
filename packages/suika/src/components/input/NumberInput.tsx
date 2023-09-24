import { FC, useEffect, useRef } from 'react';
import { parseToNumber } from '../../utils/common';
import CustomRuleInput from './CustomRuleInput';

interface INumberInputProps {
  value: string | number;
  min?: number;
  onBlur: (newValue: number) => void;
  prefix?: React.ReactNode;
}

const NumberInput: FC<INumberInputProps> = ({
  value,
  min = -Infinity,
  onBlur,
  prefix,
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
        let num = parseToNumber(str);
        if (!Number.isNaN(num) && num !== value) {
          num = Math.max(min, num);
          return String(num);
        } else {
          return false;
        }
      }}
      value={value}
      onBlur={(newVal) => onBlur(Number(newVal))}
    />
  );
};

export default NumberInput;
