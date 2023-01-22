import { FC, useEffect, useRef } from 'react';
import { parseToNumber } from '../../../../../utils/common';
import './style.scss';

interface INumberInputProps {
  value: string | number;
  onBlur: (newValue: number) => void;
}

const NumberInput: FC<INumberInputProps> = ({ value, onBlur }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      className="number-input"
      defaultValue={value}
      onMouseUp={(e) => {
        const el = e.currentTarget;
        el.setSelectionRange(0, el.value.length);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        if (inputRef.current) {
          const str = inputRef.current.value.trim();
          const number = parseToNumber(str);
          if (!Number.isNaN(number) && number !== value) {
            onBlur(number);
          } else {
            e.target.value = String(value);
          }
        }
      }}
    />
  );
};

export default NumberInput;
