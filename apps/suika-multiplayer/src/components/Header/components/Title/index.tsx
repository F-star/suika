import './style.scss';

import { GithubOutlined } from '@suika/icons';
import { type FC } from 'react';

interface IProps {
  value: string;
}

const Title: FC<IProps> = ({ value }) => {
  return (
    <div className="suika-header-title">
      <a href="https://github.com/F-star/suika" target="_blank">
        {value}
      </a>
    </div>
  );
};

export default Title;
