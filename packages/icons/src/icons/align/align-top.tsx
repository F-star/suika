import React from 'react';

export const AlignTop = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 5L19 5" />
      <line
        y1="-1.5"
        x2="12"
        y2="-1.5"
        transform="matrix(4.37114e-08 1 1 -4.37114e-08 10 7)"
        strokeWidth="3"
      />
      <line x1="13.5" y1="7" x2="13.5" y2="15" strokeWidth="3" />
    </svg>
  );
});
