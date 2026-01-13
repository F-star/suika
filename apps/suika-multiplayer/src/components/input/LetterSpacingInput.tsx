import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

export interface LetterSpacingInputProps {
  value: number;
  unit: 'PIXELS' | 'PERCENT';
  onChange: (value: number, unit: 'PIXELS' | 'PERCENT') => void;
  className?: string;
  mixed?: boolean;
}

export const LetterSpacingInput: React.FC<LetterSpacingInputProps> = ({
  value,
  unit,
  onChange,
  className,
  mixed = false,
}) => {
  const intl = useIntl();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Helper to format the display value
  const formatDisplayValue = (val: number, u: 'PIXELS' | 'PERCENT') => {
    return `${val}${u === 'PIXELS' ? 'px' : '%'}`;
  };

  // Sync internal state with props when not focused
  useEffect(() => {
    if (!isFocused) {
      if (mixed) {
        setInputValue(intl.formatMessage({ id: 'mixed' }));
      } else {
        setInputValue(formatDisplayValue(value, unit));
      }
    }
  }, [value, unit, isFocused, mixed, intl]);

  const handleBlur = () => {
    setIsFocused(false);
    const selection = window.getSelection();
    selection && selection.removeAllRanges();
    parseAndSubmit(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!e.nativeEvent.isComposing && e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const parseAndSubmit = (rawStr: string) => {
    const str = rawStr.trim();

    // Regex to capture number and optional suffix (px or %)
    // Matches numbers like "10", "10.5", ".5", "-10", "-10.5", "10px", "10%", "10 px", "-10px", "-10%"
    const match = str.match(/^(-?\d*\.?\d+)\s*(px|%)?$/);

    if (match) {
      const num = parseFloat(match[1]);
      const suffix = match[2];

      let newUnit = unit;
      if (suffix === 'px') {
        newUnit = 'PIXELS';
      } else if (suffix === '%') {
        newUnit = 'PERCENT';
      }

      // Update parent
      onChange(num, newUnit);

      // Force update local state to ensure correct formatting
      // (e.g. if user typed "10", we want "10px" or "10%")
      setInputValue(formatDisplayValue(num, newUnit));
    } else {
      // Invalid input (e.g. empty string or non-numeric), revert to current props
      if (mixed) {
        setInputValue(intl.formatMessage({ id: 'mixed' }));
      } else {
        setInputValue(formatDisplayValue(value, unit));
      }
    }
  };

  return (
    <input
      type="text"
      className={cn(
        'flex h-9 w-full rounded-md border border-transparent bg-[#f5f5f5] px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:border-[#e6e6e6] focus-visible:outline-none focus-visible:border-[#0d99ff] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={(e) => {
        setIsFocused(true);
        e.target.select();
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
