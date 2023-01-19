import React, { FC } from 'react';
import './style.scss';

interface IInfoCardProps {
  title?: string;
  children: React.ReactNode;
}

export const InfoCard: FC<IInfoCardProps> = ({ title, children }) => {
  return (
    <div className="info-card">
      <div className="info-card-title">{title}</div>
      {children}
    </div>
  );
};
