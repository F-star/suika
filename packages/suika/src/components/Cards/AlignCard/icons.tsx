import React, { FC } from 'react';

export const IconAlignLeft: FC = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 4L4 20" stroke="#333333" />
      <line
        x1="6"
        y1="9.5"
        x2="18"
        y2="9.5"
        stroke="#333333"
        strokeWidth="3"
      />
      <line
        x1="6"
        y1="14.5"
        x2="14"
        y2="14.5"
        stroke="#333333"
        strokeWidth="3"
      />
    </svg>
  );
});

export const IconAlignHCenter: FC = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 4L12 20" stroke="#333333" />
      <line
        x1="6"
        y1="9.5"
        x2="18"
        y2="9.5"
        stroke="#333333"
        strokeWidth="3"
      />
      <line
        x1="8"
        y1="14.5"
        x2="16"
        y2="14.5"
        stroke="#333333"
        strokeWidth="3"
      />
    </svg>
  );
});

export const IconAlignRight: FC = React.memo(() => {
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

export const IconAlignTop: FC = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 5L19 5" stroke="#333333" />
      <line
        y1="-1.5"
        x2="12"
        y2="-1.5"
        transform="matrix(4.37114e-08 1 1 -4.37114e-08 10 7)"
        stroke="#333333"
        strokeWidth="3"
      />
      <line
        x1="13.5"
        y1="7"
        x2="13.5"
        y2="15"
        stroke="#333333"
        strokeWidth="3"
      />
    </svg>
  );
});

export const IconAlignVCenter: FC = React.memo(() => {
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

export const IconAlignBottom: FC = React.memo(() => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 19L21 19" stroke="#333333" />
      <line
        y1="-1.5"
        x2="12"
        y2="-1.5"
        transform="matrix(4.37114e-08 1 1 -4.37114e-08 12 5)"
        stroke="#333333"
        strokeWidth="3"
      />
      <path d="M15.5 9L15.5 17" stroke="#333333" strokeWidth="3" />
    </svg>
  );
});
