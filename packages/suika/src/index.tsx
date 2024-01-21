import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// vite does not automatically import styles when referencing other packages, you need to manually import them
// TODO: FIXME: find a better way to do this
if (import.meta.env.PROD) {
  import('@suika/components/dist/style.css');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
