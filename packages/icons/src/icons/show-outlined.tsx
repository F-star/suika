import React from 'react';

export const ShowOutlined = React.memo(() => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4C3 4 1 8 1 8C1 8 3 12 8 12C13 12 15 8 15 8C15 8 13 4 8 4Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
});
