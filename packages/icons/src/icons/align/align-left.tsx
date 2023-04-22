import React from 'react';

export const AlignLeft = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
    >
      <path d="M4 4L4 20" />
      <line x1="6" y1="9.5" x2="18" y2="9.5" strokeWidth="3" />
      <line x1="6" y1="14.5" x2="14" y2="14.5" strokeWidth="3" />
    </svg>
  );
});
