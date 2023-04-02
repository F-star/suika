import { IntlProvider } from 'react-intl';
import './App.css';
import Editor from './components/Editor';
import { zh } from './locale/zh';
import { en } from './locale/en';
import { useEffect, useState } from 'react';
import { appEventEmitter } from './events';
import { SupportedLocale } from './locale/types';
import store from 'store2';

const messageMap = {
  zh,
  en,
};

const getLocale = (): SupportedLocale => {
  const locale = store.get('suika-locale') || navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};

function App() {
  const [locale, setLocale] = useState(getLocale());

  useEffect(() => {
    const localeChangeHandler = (locale: SupportedLocale) => {
      setLocale(locale);
    };
    appEventEmitter.on('localeChange', localeChangeHandler);
    return () => {
      appEventEmitter.off('localeChange', localeChangeHandler);
    };
  });

  return (
    <IntlProvider locale={locale} messages={messageMap[locale]}>
      <div className="suika">
        <Editor />
      </div>
    </IntlProvider>
  );
}

export default App;
