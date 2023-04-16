import React from 'react';


export const AlignVCenter = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 12L20 12" stroke="#333333" />
      <line
        x1="9.5"
        y1="18"
        x2="9.5"
        y2="6"
        stroke="#333333"
        strokeWidth="3"
      />
      <path d="M14.5 16L14.5 8" stroke="#333333" strokeWidth="3" />
    </svg>
  );
});