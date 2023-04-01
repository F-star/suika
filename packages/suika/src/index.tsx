import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { IntlProvider } from 'react-intl';
import { zh } from './locale/zh';
import { en } from './locale/en';

const messageMap = {
  zh,
  en,
};

const getLocale = () => {
  const locale = navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};
const locale = getLocale();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <IntlProvider locale={locale} messages={messageMap[locale]}>
      <App />
    </IntlProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
