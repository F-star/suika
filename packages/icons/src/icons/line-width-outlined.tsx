import React from 'react';

export const LineWidthOutlined = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="4" y1="6.5" x2="20" y2="6.5" />
      <line x1="4" y1="16" x2="20" y2="16" strokeWidth="4" />
      <line x1="4" y1="10.5" x2="20" y2="10.5" strokeWidth="3" />
    </svg>
  );
});
