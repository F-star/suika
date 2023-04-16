import React from 'react';

export const Rect = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4.5" y="6.5" width="16" height="11" rx="0.5" stroke="#333" />
    </svg>
  );
});