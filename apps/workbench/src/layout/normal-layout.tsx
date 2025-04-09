import { Outlet } from 'react-router-dom';

import { Header } from '../components/header';
import { LeftBar } from '../components/left-bar';
import styles from './normal-layout.module.less';
export const NormalLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      {/* 侧边栏 */}
      <div className={styles.sidebar}>
        <LeftBar />
      </div>
      <div style={{ flex: 1 }}>
        <Header />
        <div className={styles.fileViewContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
