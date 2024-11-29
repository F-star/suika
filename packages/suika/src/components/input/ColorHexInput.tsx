import { normalizeHex } from '@suika/common';
import { type FC, useEffect, useRef } from 'react';

import CustomRuleInput from './CustomRuleInput';

interface IProps {
  value: string;
  onChange: (newValue: string) => void;
  prefix?: React.ReactNode;
  classNames?: string[];
}

export const ColorHexInput: FC<IProps> = ({
  value,
  onChange,
  prefix,
  classNames,
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
      classNames={classNames}
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
      onChange={(newVal) => onChange(newVal)}
    />
  );
};
