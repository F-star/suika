import './style.scss';

import React, { type FC, useEffect, useRef } from 'react';

interface ICustomRuleInputProps {
  parser: (newValue: string, preValue: string | number) => string | false;
  value: string | number;
  onBlur: (newValue: string) => void;
  prefix?: React.ReactNode;
}

const CustomRuleInput: FC<ICustomRuleInputProps> = ({
  value,
  onBlur,
  parser,
  prefix,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <div className="suika-custom-ruler-input-box">
      {prefix}
      <input
        ref={inputRef}
        className="custom-rule-input"
        defaultValue={value}
        onMouseUp={(e) => {
          const el = e.currentTarget;
          if (!isActive.current) {
            el.select();
          }
          isActive.current = true;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.currentTarget.blur();
          }
        }}
        onBlur={(e) => {
          isActive.current = false;
          const selection = window.getSelection();
          selection && selection.removeAllRanges();
          if (inputRef.current) {
            const str = inputRef.current.value.trim();
            const newValue = parser(str, value);
            if (newValue !== false) {
              e.target.value = String(newValue);
              onBlur(newValue);
            } else {
              e.target.value = String(value);
            }
          }
        }}
      />
    </div>
  );
};

export default CustomRuleInput;
