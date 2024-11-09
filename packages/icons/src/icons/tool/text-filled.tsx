import React from 'react';

export const TextFilled = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="11" y="5" width="1" height="14" />
      <rect x="5" y="5" width="13" height="1" />
      <rect x="5" y="5" width="1" height="3" />
      <rect x="17" y="5" width="1" height="3" />
      <rect x="8" y="18" width="7" height="1" />
    </svg>
  );
});
