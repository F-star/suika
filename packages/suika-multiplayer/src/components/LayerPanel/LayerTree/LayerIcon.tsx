import React from 'react';

interface LayerIconProps {
  content: string;
  enableStroke?: boolean;
  enableFill?: boolean;
}

export const LayerIcon = React.memo(
  ({ content, enableStroke = true, enableFill }: LayerIconProps) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="12"
        height="12"
      >
        <path
          d={content}
          fill={enableFill ? 'currentColor' : 'none'}
          strokeWidth="1"
          stroke={enableStroke ? 'currentColor' : 'none'}
        />
      </svg>
    );
  },
);
