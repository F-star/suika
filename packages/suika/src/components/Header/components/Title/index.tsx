import './style.scss';

import { GithubOutlined } from '@suika/icons';
import { FC } from 'react';

const Title: FC = () => {
  return (
    <div className="suika-header-title">
      <GithubOutlined />
      <a href="https://github.com/F-star/suika" target="_blank">
        suika
      </a>
    </div>
  );
};

export default Title;
