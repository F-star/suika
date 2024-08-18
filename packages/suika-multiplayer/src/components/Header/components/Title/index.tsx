import './style.scss';

import { type FC } from 'react';

interface IProps {
  value: string;
}

const Title: FC<IProps> = ({ value }) => {
  return (
    <div className="suika-header-title">
      <div className="sk-header-title-content">{value}</div>
    </div>
  );
};

export default Title;
