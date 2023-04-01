import { FC, useEffect, useRef } from 'react';
import './style.scss';

interface ICustomRuleInputProps {
  parser: (newValue: string) => string | false;
  value: string | number;
  onBlur: (newValue: string) => void;
}

const CustomRuleInput: FC<ICustomRuleInputProps> = ({ value, onBlur, parser }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
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
          const newValue = parser(str);
          if (newValue !== false) {
            onBlur(newValue);
          } else {
            e.target.value = String(value);
          }
        }
      }}
    />
  );
};

export default CustomRuleInput;
