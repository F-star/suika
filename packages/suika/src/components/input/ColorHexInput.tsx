import { FC, useEffect, useRef } from 'react';
import CustomRuleInput from './CustomRuleInput';
import { normalizeHex } from '../../utils/color';

interface IProps {
  value: string;
  onBlur: (newValue: string) => void;
  prefix?: React.ReactNode;
}

export const ColorHexInput: FC<IProps> = ({ value, onBlur, prefix }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <CustomRuleInput
      prefix={prefix}
      parser={(str, prevStr) => {
        str = str.trim();
        // check if it is a valid hex and normalize it
        str = normalizeHex(str);
        if (!str || str === prevStr) {
          return false;
        }
        return str;
      }}
      value={value}
      onBlur={(newVal) => onBlur(newVal)}
    />
  );
};
