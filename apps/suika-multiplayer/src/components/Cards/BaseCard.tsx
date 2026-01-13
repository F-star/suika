import React, { type FC } from 'react';

interface IBaseCardProps {
  title?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const BaseCard: FC<IBaseCardProps> = ({
  title,
  children,
  headerAction,
}) => {
  return (
    <div className="pt-2 pb-2 border-b border-[#e2e2e2]">
      {title && (
        <div className="flex justify-between items-center px-2 pl-4 h-8 leading-8 text-[#333] font-bold text-xs">
          <span>{title}</span>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};
