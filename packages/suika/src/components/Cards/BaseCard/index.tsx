import React, { FC } from 'react';
import './style.scss';

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
    <div className="info-card">
      {title && (
        <div className="info-card-title">
          <span>{title}</span>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};
