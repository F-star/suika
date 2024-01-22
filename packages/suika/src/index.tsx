import './index.css';
// vite does not automatically import styles when referencing other packages, you need to manually import them
import '@suika/core/dist/style.css';
import '@suika/components/dist/style.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
