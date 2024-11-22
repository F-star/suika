import './style.scss';

import classNames from 'classnames';
import React, { type FC, useEffect, useRef } from 'react';

interface ICustomRuleInputProps {
  parser: (newValue: string, preValue: string | number) => string | false;
  value: string | number;
  onChange: (newValue: string) => void;
  prefix?: React.ReactNode;
  classNames?: string[];
}

const CustomRuleInput: FC<ICustomRuleInputProps> = (props) => {
  const { value, onChange, parser, prefix } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  return (
    <div
      className={classNames('suika-custom-ruler-input-box', props.classNames)}
    >
      {prefix && <div className="suika-custom-input-prefix">{prefix}</div>}
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
              onChange(newValue);
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
