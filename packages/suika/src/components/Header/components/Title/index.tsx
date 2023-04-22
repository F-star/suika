import { FC } from 'react';
import './style.scss';
import { GithubOutlined } from '@suika/icons';

const Title: FC = () => {
  return (
    <div className="title">
      <GithubOutlined />
      <a href="https://github.com/F-star/suika" target="_blank">
        suika
      </a>
    </div>
  );
};

export default Title;
