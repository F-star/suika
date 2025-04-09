import { Avatar, Dropdown, MenuProps } from 'antd';
import { FC, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { ApiService } from '../../api-service';
import styles from './header.module.less';

export const Header: FC = () => {
  const [username, setUsername] = useState('');
  const intl = useIntl();
  const navigate = useNavigate();

  useEffect(() => {
    ApiService.getUserInfo().then((res) => {
      setUsername(res.data.username);
    });
  }, []);

  const menuItems: MenuProps['items'] = [
    {
      key: '0',
      label: <div style={{ width: 120 }}>{username}</div>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: intl.formatMessage({ id: 'logout' }),
    },
  ];

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    // message.info(`Click on item ${key}`);
    if (key === 'logout') {
      // delete the cookie named access_token, then redirect to /login page
      document.cookie =
        'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      navigate('/login');
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerRight}>
        <Dropdown
          trigger={['click']}
          menu={{ items: menuItems, onClick: onMenuClick }}
        >
          <Avatar
            style={{
              cursor: 'default',
              userSelect: 'none',
              backgroundColor: '#ff5c10',
            }}
          >
            {username.slice(0, 2)}
          </Avatar>
        </Dropdown>
      </div>
    </div>
  );
};
