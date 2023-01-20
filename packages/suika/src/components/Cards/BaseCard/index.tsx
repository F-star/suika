import React, { FC } from 'react';
import './style.scss';

interface IBaseCardProps {
  title?: string;
  children: React.ReactNode;
}

export const BaseCard: FC<IBaseCardProps> = ({ title, children }) => {
  return (
    <div className="info-card">
      {title && <div className="info-card-title">{title}</div>}
      {children}
    </div>
  );
};
