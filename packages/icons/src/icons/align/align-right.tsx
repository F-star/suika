import React from 'react';

export const AlignRight = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 4L20 20" stroke="#333333" />
      <line
        x1="6"
        y1="9.5"
        x2="18"
        y2="9.5"
        stroke="#333333"
        strokeWidth="3"
      />
      <line
        x1="10"
        y1="14.5"
        x2="18"
        y2="14.5"
        stroke="#333333"
        strokeWidth="3"
      />
    </svg>
  );
});
