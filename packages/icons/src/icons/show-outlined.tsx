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
        d="M8 5C4 5 2 8 2 8C2 8 4 11 8 11C12 11 14 8 14 8C14 8 12 5 8 5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.75" fill="currentColor" />
    </svg>
  );
});
